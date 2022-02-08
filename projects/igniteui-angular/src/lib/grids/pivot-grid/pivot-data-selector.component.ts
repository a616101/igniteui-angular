import { useAnimation } from "@angular/animations";
import {
    Component, HostBinding,
    Input,
    Pipe,
    PipeTransform,
    Renderer2
} from "@angular/core";
import { first } from "rxjs/operators";
import { fadeIn, fadeOut } from "../../animations/fade";
import { DisplayDensity } from "../../core/displayDensity";
import { GridColumnDataType } from "../../data-operations/data-util";
import { SortingDirection } from "../../data-operations/sorting-strategy";
import {
    IDragBaseEventArgs,
    IDragGhostBaseEventArgs,
    IDropBaseEventArgs,
    IDropDroppedEventArgs
} from "../../directives/drag-drop/drag-drop.directive";
import { ISelectionEventArgs } from "../../drop-down/drop-down.common";
import { IgxDropDownComponent } from "../../drop-down/drop-down.component";
import {
    AbsoluteScrollStrategy,
    AutoPositionStrategy,
    OverlaySettings,
    PositionSettings,
    VerticalAlignment
} from "../../services/public_api";
import { ColumnType, PivotGridType } from "../common/grid.interface";
import {
    IgxPivotAggregate,
    IgxPivotDateAggregate,
    IgxPivotTimeAggregate
} from "./pivot-grid-aggregate";
import {
    IPivotAggregator,
    IPivotDimension,
    IPivotValue,
    PivotDimensionType
} from "./pivot-grid.interface";

interface IDataSelectorPanel {
    name: string;
    type?: PivotDimensionType;
    dataKey: string;
    icon: string;
    itemKey: string;
    sortable: boolean;
    dragChannels: string[];
}

@Component({
    selector: "igx-pivot-data-selector",
    templateUrl: "./pivot-data-selector.component.html",
})
export class IgxPivotDataSelectorComponent {
    public ghost: HTMLElement;

    private _grid: PivotGridType;
    private _dropDelta = 0;

    @HostBinding("class.igx-pivot-data-selector")
    public cssClass = "igx-pivot-data-selector";
    public dimensions: IPivotDimension[];

    private _subMenuPositionSettings: PositionSettings = {
        verticalStartPoint: VerticalAlignment.Bottom,
        closeAnimation: undefined,
    };

    private _subMenuOverlaySettings: OverlaySettings = {
        closeOnOutsideClick: true,
        modal: false,
        positionStrategy: new AutoPositionStrategy(
            this._subMenuPositionSettings
        ),
        scrollStrategy: new AbsoluteScrollStrategy(),
    };
    public animationSettings = {
        closeAnimation: useAnimation(fadeOut, {
            params: {
                duration: "0ms",
            },
        }),
        openAnimation: useAnimation(fadeIn, {
            params: {
                duration: "0ms",
            },
        }),
    };

    public aggregateList: IPivotAggregator[] = [];
    public value: IPivotValue;
    public ghostText: string;
    public ghostWidth: number;
    public dropAllowed: boolean;
    public dims: IPivotDimension[];
    public values: IPivotValue[];

    constructor(private renderer: Renderer2) {}

    /**
     * @hidden @internal
     */
    public _panels: IDataSelectorPanel[] = [
        {
            name: "Filters",
            type: PivotDimensionType.Filter,
            dataKey: "filterDimensions",
            icon: "filter_list",
            itemKey: "memberName",
            sortable: false,
            dragChannels: ["Filters", "Columns", "Rows"],
        },
        {
            name: "Columns",
            type: PivotDimensionType.Column,
            dataKey: "columnDimensions",
            icon: "view_column",
            itemKey: "memberName",
            sortable: true,
            dragChannels: ["Filters", "Columns", "Rows"],
        },
        {
            name: "Rows",
            type: PivotDimensionType.Row,
            dataKey: "rowDimensions",
            icon: "table_rows",
            itemKey: "memberName",
            sortable: true,
            dragChannels: ["Filters", "Columns", "Rows"],
        },
        {
            name: "Values",
            type: null,
            dataKey: "values",
            icon: "functions",
            itemKey: "member",
            sortable: false,
            dragChannels: ["Values"],
        },
    ];

    /**
     * @hidden @internal
     */
    public get displayDensity(): DisplayDensity {
        return this.grid?.displayDensity;
    }

    /**
     * An @Input property that sets the grid.
     */
    @Input()
    public set grid(value: PivotGridType) {
        this._grid = value;
        this.dims = [
            ...this._grid.pivotConfiguration.columns,
            ...this._grid.pivotConfiguration.rows,
            ...this._grid.pivotConfiguration.filters
        ];
        this.values = this._grid.pivotConfiguration.values;
    }

    /**
     * Returns the grid.
     */
    public get grid(): PivotGridType {
        return this._grid;
    }

    /**
     * @hidden
     * @internal
     */
    public onItemSort(
        _: Event,
        dimension: IPivotDimension,
        dimensionType: PivotDimensionType
    ) {
        if (
            !this._panels.find(
                (panel: IDataSelectorPanel) => panel.type === dimensionType
            ).sortable
        )
            return;

        if (!dimension.sortDirection) {
            dimension.sortDirection = SortingDirection.None;
        }

        dimension.sortDirection =
            dimension.sortDirection + 1 > SortingDirection.Desc
                ? SortingDirection.None
                : dimension.sortDirection + 1;
        // apply same sort direction to children.
        let dim = dimension;

        while (dim.childLevel) {
            dim.childLevel.sortDirection = dimension.sortDirection;
            dim = dim.childLevel;
        }

        this.grid.pipeTrigger++;
        this.grid.cdr.markForCheck();

        if (dimensionType === PivotDimensionType.Column) {
            this.grid.setupColumns();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public onFilteringIconPointerDown(event: PointerEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * @hidden
     * @internal
     */
    public onFilteringIconClick(event: MouseEvent, dimension: IPivotDimension) {
        event.stopPropagation();
        event.preventDefault();

        let dim = dimension;
        let col: ColumnType;

        while (dim) {
            col = this.grid.dimensionDataColumns.find(
                (x) => x.field === dim.memberName
            );
            if (col) {
                break;
            } else {
                dim = dim.childLevel;
            }
        }

        this.grid.filteringService.toggleFilterDropdown(event.target, col);
    }

    /**
     * @hidden
     * @internal
     */
    protected getDimensionsByType(dimensionType: PivotDimensionType) {
        switch (dimensionType) {
            case PivotDimensionType.Row:
                if (!this.grid.pivotConfiguration.rows) {
                    this.grid.pivotConfiguration.rows = [];
                }
                return this.grid.pivotConfiguration.rows;
            case PivotDimensionType.Column:
                if (!this.grid.pivotConfiguration.columns) {
                    this.grid.pivotConfiguration.columns = [];
                }
                return this.grid.pivotConfiguration.columns;
            case PivotDimensionType.Filter:
                if (!this.grid.pivotConfiguration.filters) {
                    this.grid.pivotConfiguration.filters = [];
                }
                return this.grid.pivotConfiguration.filters;
            default:
                return null;
        }
    }

    /**
     * @hidden
     * @internal
     */
    protected getDimensionState(dimensionType: PivotDimensionType) {
        switch (dimensionType) {
            case PivotDimensionType.Row:
                return this.grid.rowDimensions;
            case PivotDimensionType.Column:
                return this.grid.columnDimensions;
            case PivotDimensionType.Filter:
                return this.grid.filterDimensions;
            default:
                return null;
        }
    }

    /**
     * @hidden
     * @internal
     */
    protected moveValueItem(itemId: string) {
        const aggregation = this.grid.pivotConfiguration.values;
        const valueIndex =
            aggregation.findIndex((x) => x.member === itemId) !== -1
                ? aggregation?.findIndex((x) => x.member === itemId)
                : aggregation.length;
        const newValueIndex =
            valueIndex + this._dropDelta < 0 ? 0 : valueIndex + this._dropDelta;

        const aggregationItem = aggregation.find(
            (x) => x.member === itemId || x.displayName === itemId
        );

        if (aggregationItem) {
            this.grid.moveValue(aggregationItem, newValueIndex);
            this.grid.valuesChange.emit({
                values: this.grid.pivotConfiguration.values,
            });
        }
    }

    /**
     * @hidden
     * @internal
     */
    public onItemDropped(
        event: IDropDroppedEventArgs,
        dimensionType: PivotDimensionType
    ) {
        if (!this.dropAllowed) {
            return;
        }

        const dimension = this.getDimensionsByType(dimensionType);
        const dimensionState = this.getDimensionState(dimensionType);
        const itemId = event.drag.element.nativeElement.id;
        const targetId = event.owner.element.nativeElement.id;
        const dimensionItem = dimension?.find((x) => x.memberName === itemId);
        const itemIndex =
            dimension?.findIndex((x) => x?.memberName === itemId) !== -1
                ? dimension?.findIndex((x) => x.memberName === itemId)
                : dimension?.length;
        const dimensions = this.grid.pivotConfiguration.rows
            .concat(this.grid.pivotConfiguration.columns)
            .concat(this.grid.pivotConfiguration.filters)
            .filter((x) => x && x.memberName === itemId);

        const reorder =
            dimensionState?.findIndex((item) => item.memberName === itemId) !==
            -1;

        let targetIndex =
            targetId !== ""
                ? dimension?.findIndex((x) => x.memberName === targetId)
                : dimension?.length;

        if (!dimension) {
            this.moveValueItem(itemId);
        }

        if (reorder) {
            targetIndex =
                itemIndex + this._dropDelta < 0
                    ? 0
                    : itemIndex + this._dropDelta;
        }

        if (dimensionItem) {
            this.grid.moveDimension(dimensionItem, dimensionType, targetIndex);
        } else {
            const newDim = dimensions.find((x) => x.memberName === itemId);
            this.grid.moveDimension(newDim, dimensionType, targetIndex);
        }

        this.grid.dimensionsChange.emit({
            dimensions: dimension,
            dimensionCollectionType: dimensionType,
        });
    }

    protected updateDropDown(
        value: IPivotValue,
        dropdown: IgxDropDownComponent
    ) {
        this.value = value;
        dropdown.width = "200px";
        this.aggregateList = this.getAggregateList(value);
        dropdown.open(this._subMenuOverlaySettings);
    }

    /**
     * @hidden
     * @internal
     */
    public onSummaryClick(
        event: MouseEvent,
        value: IPivotValue,
        dropdown: IgxDropDownComponent
    ) {
        this._subMenuOverlaySettings.target =
            event.currentTarget as HTMLElement;

        if (dropdown.collapsed) {
            this.updateDropDown(value, dropdown);
        } else {
            // close for previous chip
            dropdown.close();
            dropdown.closed.pipe(first()).subscribe(() => {
                this.updateDropDown(value, dropdown);
            });
        }
    }

    /**
     * @hidden
     * @internal
     */
    protected getAggregatorsForValue(value: IPivotValue): IPivotAggregator[] {
        const dataType =
            value.dataType ||
            this.grid.resolveDataTypes(this.grid.data[0][value.member]);
        switch (dataType) {
            case GridColumnDataType.Number:
            case GridColumnDataType.Currency:
                return IgxPivotDateAggregate.aggregators();
            case GridColumnDataType.Date:
            case GridColumnDataType.DateTime:
                return IgxPivotDateAggregate.aggregators();
            case GridColumnDataType.Time:
                return IgxPivotTimeAggregate.aggregators();
            default:
                return IgxPivotAggregate.aggregators();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public getAggregateList(val: IPivotValue): IPivotAggregator[] {
        if (!val.aggregateList) {
            let defaultAggr = this.getAggregatorsForValue(val);
            const isDefault = defaultAggr.find(
                (x) => x.key === val.aggregate.key
            );
            // resolve custom aggregations
            if (!isDefault && this.grid.data[0][val.member] !== undefined) {
                // if field exists, then we can apply default aggregations and add the custom one.
                defaultAggr.unshift(val.aggregate);
            } else if (!isDefault) {
                // otherwise this is a custom aggregation that is not compatible
                // with the defaults, since it operates on field that is not in the data
                // leave only the custom one.
                defaultAggr = [val.aggregate];
            }
            val.aggregateList = defaultAggr;
        }
        return val.aggregateList;
    }

    /**
     * @hidden
     * @internal
     */
    public onAggregationChange(event: ISelectionEventArgs) {
        if (!this.isSelected(event.newSelection.value)) {
            this.value.aggregate = event.newSelection.value;
            this.grid.pipeTrigger++;
            this.grid.cdr.markForCheck();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public isSelected(val: IPivotAggregator) {
        return this.value.aggregate.key === val.key;
    }

    /**
     * @hidden
     * @internal
     */
    public ghostCreated(event: IDragGhostBaseEventArgs, value: string) {
        const { width: itemWidth } =
            event.owner.element.nativeElement.getBoundingClientRect();
        this.ghostWidth = itemWidth;
        this.ghostText = value;
        this.renderer.setStyle(
            event.owner.element.nativeElement,
            "position",
            "absolute"
        );
        this.renderer.setStyle(
            event.owner.element.nativeElement,
            "visibility",
            "hidden"
        );
        this.ghost = event.ghostElement;
    }

    public ghostDestroyed(event: IDragGhostBaseEventArgs, value: string) {
        console.log(event.ghostElement);
    }

    /**
     * @hidden
     * @internal
     */
    public toggleItem(item: IPivotDimension | IPivotValue) {
        if (item as IPivotValue) {
            this.grid.toggleValue(item as IPivotValue);
        }

        if (item as IPivotDimension) {
            this.grid.toggleDimension(item as IPivotDimension);
        }
    }

    /**
     * @hidden
     * @internal
     */
    public onPanelEntry(event: IDropBaseEventArgs, panel: string) {
        this.dropAllowed = event.dragData.some(
            (channel: string) => channel === panel
        );
    }

    /**
     * @hidden
     * @internal
     */
    public onItemDragMove(event: IDragBaseEventArgs) {
        const clientRect =
            event.owner.element.nativeElement.getBoundingClientRect();
        this._dropDelta = Math.round(
            (event.pageY - event.startY) / clientRect.height
        );
    }

    /**
     * @hidden
     * @internal
     */
    public onItemDragEnd(event: IDragBaseEventArgs) {
        this.renderer.setStyle(
            event.owner.element.nativeElement,
            "position",
            "static"
        );
        this.renderer.setStyle(
            event.owner.element.nativeElement,
            "visibility",
            "visible"
        );
    }

    /**
     * @hidden
     * @internal
     */
    public onItemDragOver(event: IDropBaseEventArgs) {
        if (this.dropAllowed) {
            this.renderer.addClass(
                event.owner.element.nativeElement,
                "igx-drag--push"
            );
        }
    }

    /**
     * @hidden
     * @internal
     */
    public onItemDragLeave(event: IDropBaseEventArgs) {
        if (this.dropAllowed) {
            this.renderer.removeClass(
                event.owner.element.nativeElement,
                "igx-drag--push"
            );
        }
    }
}

@Pipe({ name: "filterPivotItems" })
export class IgxFilterPivotItemsPipe implements PipeTransform {
    public transform(
        collection: (IPivotDimension | IPivotValue)[],
        filterCriteria: string,
        _pipeTrigger: number
    ): any[] {
        if (!collection) {
            return collection;
        }
        let copy = collection.slice(0);
        if (filterCriteria && filterCriteria.length > 0) {
            const filterFunc = (c) => {
                const filterText = c.member || c.memberName;
                if (!filterText) {
                    return false;
                }
                return (
                    filterText
                        .toLocaleLowerCase()
                        .indexOf(filterCriteria.toLocaleLowerCase()) >= 0 ||
                    (c.children?.some(filterFunc) ?? false)
                );
            };
            copy = collection.filter(filterFunc);
        }
        return copy;
    }
}
