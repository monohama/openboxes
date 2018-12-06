import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Form } from 'react-final-form';
import { withRouter } from 'react-router-dom';
import { confirmAlert } from 'react-confirm-alert';
import queryString from 'query-string';
import { Translate } from 'react-localize-redux';

import 'react-confirm-alert/src/react-confirm-alert.css';

import TextField from '../form-elements/TextField';
import SelectField from '../form-elements/SelectField';
import DateField from '../form-elements/DateField';
import { renderFormField } from '../../utils/form-utils';
import apiClient from '../../utils/apiClient';
import { showSpinner, hideSpinner } from '../../actions';
import { debouncedUsersFetch, debouncedLocationsFetch } from '../../utils/option-utils';

function validate(values) {
  const errors = {};
  if (!values.description) {
    errors.description = 'error.requiredField.label';
  }
  if (!values.origin) {
    errors.origin = 'error.requiredField.label';
  }
  if (!values.destination) {
    errors.destination = 'error.requiredField.label';
  }
  if (!values.requestedBy) {
    errors.requestedBy = 'error.requiredField.label';
  }
  if (!values.dateRequested) {
    errors.dateRequested = 'error.requiredField.label';
  }
  return errors;
}

const FIELDS = {
  description: {
    type: TextField,
    label: 'stockMovement.description.label',
    attributes: {
      required: true,
      autoFocus: true,
    },
  },
  origin: {
    type: SelectField,
    label: 'stockMovement.origin.label',
    attributes: {
      required: true,
      async: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      loadOptions: debouncedLocationsFetch,
      cache: false,
      options: [],
      filterOptions: options => options,
    },
    getDynamicAttr: props => ({
      onChange: (value) => {
        if (value && props.destination && props.destination.id) {
          props.fetchStockLists(value, props.destination);
        }
      },
      disabled: queryString.parse(window.location.search).direction === 'OUTBOUND' && !props.isSuperuser,
    }),
  },
  destination: {
    type: SelectField,
    label: 'stockMovement.destination.label',
    attributes: {
      required: true,
      async: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      loadOptions: debouncedLocationsFetch,
      cache: false,
      options: [],
      filterOptions: options => options,
    },
    getDynamicAttr: props => ({
      onChange: (value) => {
        if (value && props.origin && props.origin.id) {
          props.fetchStockLists(props.origin, value);
        }
      },
      disabled: queryString.parse(window.location.search).direction === 'INBOUND' && !props.isSuperuser,
    }),
  },
  stockList: {
    label: 'stockMovement.stocklist.label',
    type: SelectField,
    getDynamicAttr: ({ origin, destination, stocklists }) => ({
      disabled: !(origin && destination && origin.id && destination.id),
      options: stocklists,
      showValueTooltip: true,
      objectValue: true,
    }),
  },
  requestedBy: {
    type: SelectField,
    label: 'stockMovement.requestedBy.label',
    attributes: {
      async: true,
      required: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      loadOptions: debouncedUsersFetch,
      cache: false,
      options: [],
      labelKey: 'name',
      filterOptions: options => options,
    },
  },
  dateRequested: {
    type: DateField,
    label: 'stockMovement.dateRequested.label',
    attributes: {
      required: true,
      dateFormat: 'MM/DD/YYYY',
      autoComplete: 'off',
    },
  },
};

  /** The first step of stock movement where user can add all the basic information. */
class CreateStockMovement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stocklists: [],
      setInitialLocations: true,
      values: this.props.initialValues,
    };
    this.fetchStockLists = this.fetchStockLists.bind(this);
  }

  componentDidMount() {
    if (this.state.values.origin && this.state.values.destination) {
      this.fetchStockLists(this.state.values.origin, this.state.values.destination);
    }
  }

  componentWillReceiveProps() {
    if (!this.props.match.params.stockMovementId && this.state.setInitialLocations
      && this.props.location.id) {
      this.setInitialLocations();
    }
  }

  setInitialLocations() {
    const { id } = this.props.location;
    const { locationType } = this.props.location;
    const { name } = this.props.location;

    if (queryString.parse(window.location.search).direction === 'INBOUND') {
      const values = {
        destination: {
          id,
          type: locationType ? locationType.locationTypeCode : null,
          name,
          label: `${name} [${locationType ? locationType.description : null}]`,
        },
      };
      this.setState({ values, setInitialLocations: false });
    }

    if (queryString.parse(window.location.search).direction === 'OUTBOUND') {
      const values = {
        origin: {
          id,
          type: locationType ? locationType.locationTypeCode : null,
          name,
          label: `${name} [${locationType ? locationType.description : null}]`,
        },
      };
      this.setState({ values, setInitialLocations: false });
    }
  }

  checkStockMovementChange(newValues) {
    const { origin, destination, stocklist } = this.props.initialValues;

    const originLocs = newValues.origin && origin;
    const isOldSupplier = origin && origin.type === 'SUPPLIER';
    const isNewSupplier = newValues.origin && newValues.type === 'SUPPLIER';
    const checkOrigin = originLocs && (!isOldSupplier || (isOldSupplier && !isNewSupplier)) ?
      newValues.origin.id !== origin.id : false;

    const checkDest = stocklist && newValues.destination && destination ?
      newValues.destination.id !== destination.id : false;
    const checkStockList = newValues.stockMovementId ? _.get(newValues.stocklist, 'id') !== _.get(stocklist, 'id') : false;

    return (checkOrigin || checkDest || checkStockList);
  }

  /**
   * Fetches available stock lists from API with given origin and destination.
   * @param {object} origin
   * @param {object} destination
   * @public
   */
  fetchStockLists(origin, destination) {
    this.props.showSpinner();
    const url = `/openboxes/api/stocklists?origin.id=${origin.id}&destination.id=${destination.id}`;

    return apiClient.get(url)
      .then((response) => {
        const stocklists = _.map(response.data.data, stocklist => (
          { value: { id: stocklist.id, name: stocklist.name }, label: stocklist.name }
        ));
        this.setState({ stocklists }, () => this.props.hideSpinner());
      })
      .catch(() => this.props.hideSpinner());
  }


  /**
   * Creates or updates stock movement with given data
   * @param {object} values
   * @public
   */
  saveStockMovement(values) {
    if (values.origin && values.destination && values.requestedBy &&
      values.dateRequested && values.description) {
      this.props.showSpinner();

      let stockMovementUrl = '';
      if (values.stockMovementId) {
        stockMovementUrl = `/openboxes/api/stockMovements/${values.stockMovementId}`;
      } else {
        stockMovementUrl = '/openboxes/api/stockMovements';
      }

      const payload = {
        name: '',
        description: values.description,
        dateRequested: values.dateRequested,
        'origin.id': values.origin.id,
        'destination.id': values.destination.id,
        'requestedBy.id': values.requestedBy.id,
        'stocklist.id': _.get(values.stocklist, 'id') || '',
        forceUpdate: values.forceUpdate || '',
      };

      apiClient.post(stockMovementUrl, payload)
        .then((response) => {
          if (response.data) {
            const resp = response.data.data;
            this.props.history.push(`/openboxes/stockMovement/create/${resp.id}`);
            this.props.onSubmit({
              ...values,
              stockMovementId: resp.id,
              lineItems: resp.lineItems,
              movementNumber: resp.identifier,
              name: resp.name,
              stocklist: resp.stocklist,
            });
          }
        })
        .catch(() => {
          this.props.hideSpinner();
          return Promise.reject(new Error('Could not create stock movement'));
        });
    }

    return new Promise(((resolve, reject) => {
      reject(new Error('Missing required parameters'));
    }));
  }

  resetToInitialValues() {
    this.setState({
      values: {},
    }, () => this.setState({
      values: this.props.initialValues,
    }));
  }

  /**
   * Calls method creating or saving stock movement and moves user to the next page.
   * @param {object} values
   * @public
   */
  nextPage(values) {
    const showModal = this.checkStockMovementChange(values);
    if (!showModal) {
      this.saveStockMovement(values);
    } else {
      confirmAlert({
        title: 'message.confirmChange.label',
        message: 'confirmChange.message',
        buttons: [
          {
            label: 'default.no.label',
            onClick: () => this.resetToInitialValues(),
          },
          {
            label: 'default.yes.label',
            onClick: () => this.saveStockMovement({ ...values, forceUpdate: 'true' }),
          },
        ],
      });
    }
  }

  render() {
    return (
      <Form
        onSubmit={values => this.nextPage(values)}
        validate={validate}
        initialValues={this.state.values}
        render={({ handleSubmit, values }) => (
          <form className="create-form" onSubmit={handleSubmit}>
            {_.map(
              FIELDS,
              (fieldConfig, fieldName) => renderFormField(fieldConfig, fieldName, {
                stocklists: this.state.stocklists,
                fetchStockLists: this.fetchStockLists,
                origin: values.origin,
                destination: values.destination,
                isSuperuser: this.props.isSuperuser,
              }),
            )}
            <div>
              <button type="submit" className="btn btn-outline-primary float-right btn-xs"><Translate id="default.button.next.label" /></button>
            </div>
          </form>
        )}
      />
    );
  }
}

const mapStateToProps = state => ({
  location: state.session.currentLocation,
  isSuperuser: state.session.isSuperuser,
});

export default withRouter(connect(mapStateToProps, {
  showSpinner, hideSpinner,
})(CreateStockMovement));

CreateStockMovement.propTypes = {
  /** React router's object which contains information about url varaiables and params */
  match: PropTypes.shape({
    params: PropTypes.shape({ stockMovementId: PropTypes.string }),
  }).isRequired,
  /** Initial component's data */
  initialValues: PropTypes.shape({
    origin: PropTypes.shape({
      id: PropTypes.string,
    }),
    destination: PropTypes.shape({
      id: PropTypes.string,
    }),
    stocklist: PropTypes.shape({}),
  }).isRequired,
  /** Function called when data is loading */
  showSpinner: PropTypes.func.isRequired,
  /** Function called when data has loaded */
  hideSpinner: PropTypes.func.isRequired,
  /**
   * Function called with the form data when the handleSubmit()
   * is fired from within the form component.
   */
  onSubmit: PropTypes.func.isRequired,
  /** React router's object used to manage session history */
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  /** Current location */
  location: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.string,
    locationType: PropTypes.shape({
      description: PropTypes.string,
      locationTypeCode: PropTypes.string,
    }),
  }).isRequired,
  /** Return true if current user is superuser */
  isSuperuser: PropTypes.bool.isRequired,
};
