<div id="requisition-template-header" class="box dialog">
    <div>
        <h2>
            <warehouse:message code="requisitionTemplate.label" default="Requisition template"/>
        </h2>
    </div>

    <table id="requisition-header-details-table" class="header-summary-table">

        <tbody>
            <tr class="prop">
                <td class="name"><label><warehouse:message
                        code="requisition.requisitionType.label" /></label></td>
                <td class="value">
                    <g:if test="${requisition?.type}">
                        <format:metadata obj="${requisition?.type }"/>
                    </g:if>
                    <g:else>
                        <span class="fade">
                            ${warehouse.message(code:'default.none.label')}
                        </span>
                    </g:else>
                </td>
            </tr>
            <tr class="prop">
                <td class="name">
                    <label for="origin.id">
                        <warehouse:message code="requisition.origin.label" />
                    </label>
                </td>
                <td class="value ${hasErrors(bean: requisition, field: 'origin', 'errors')}">
                    <span id="origin.id">${requisition?.origin?.name }</span>
                </td>
            </tr>

            <tr class="prop">
                <td class="name">
                    <label for="destination.id">
                        <warehouse:message code="requisition.destination.label" />
                    </label>
                </td>
                <td class="value">
                    <span id="destination.id"> ${requisition?.destination?.name }</span>
                </td>
            </tr>
            <tr class="prop">
                <td class="name">
                    <label for="requestedBy.id">
                        <warehouse:message code="requisitionTemplate.requestedBy.label" />
                    </label>
                </td>
                <td class="value">
                    <span id="requestedBy.id"> ${requisition?.requestedBy?.name }</span>
                </td>
            </tr>

            <tr class="prop">
                <td class="name"><label><warehouse:message
                        code="requisition.commodityClass.label" /></label></td>
                <td class="value">
                    <g:if test="${requisition?.commodityClass}">
                        <format:metadata obj="${requisition?.commodityClass }"/>
                    </g:if>
                    <g:else>
                        <span class="fade">
                            ${warehouse.message(code:'default.none.label')}
                        </span>

                    </g:else>
                </td>
            </tr>
            <tr class="prop">
                <td class="name">
                    <label for="description">
                        <warehouse:message code="default.comments.label" />
                    </label>
                </td>

                <td class="value">
                    <span id="description">
                        ${requisition?.description?:warehouse.message(code:'default.none.label') }
                    </span>
                </td>
            </tr>
        </tbody>

    </table>
</div>

<div id="requisition-auditing" class="box dialog">
    <div style="line-height: 20px;">
        <h2>
            <warehouse:message code="default.auditing.label"/>
        </h2>
    </div>
    <table>
        <tbody>
            <tr class="prop">
                <td class="name">
                    <label><warehouse:message
                            code="default.version.label" default="Version"/></label>
                </td>
                <td class="value">
                    v${requisition?.version}
                </td>
            </tr>
            <tr class="prop">
                <td class="name">
                    <label><warehouse:message
                            code="requisitionTemplate.published.label" default="Published"/></label>
                </td>
                <td class="value">
                    ${requisition?.isPublished}
                </td>
            </tr>
            <tr class="prop">
                <td class="name">
                    <label><warehouse:message
                            code="requisition.createdBy.label" /></label>
                </td>
                <td class="value">
                    ${requisition?.createdBy?.name}
                    <div class="fade">
                        <g:formatDate date="${requisition?.dateCreated }"/>
                    </div>
                </td>
            </tr>
            <tr class="prop">
                <td class="name">
                    <label><warehouse:message
                            code="default.updatedBy.label" /></label>
                </td>
                <td class="value">
                    ${requisition?.updatedBy?.name }
                    <div class="fade">
                        <g:formatDate date="${requisition?.lastUpdated }"/>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>