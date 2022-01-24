import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Inject,
    OnChanges,
    QueryList,
    Renderer2,
    ViewChild,
    SimpleChanges,
    ViewChildren
} from '@angular/core';
import { first } from 'rxjs/operators';
import { IBaseChipEventArgs, IgxChipComponent } from '../../chips/chip.component';
import { IgxChipsAreaComponent } from '../../chips/chips-area.component';
import { GridColumnDataType } from '../../data-operations/data-util';
import { SortingDirection } from '../../data-operations/sorting-strategy';
import { IgxGridForOfDirective } from '../../directives/for-of/for_of.directive';
import { ISelectionEventArgs } from '../../drop-down/drop-down.common';
import { IgxDropDownComponent } from '../../drop-down/drop-down.component';
import { AbsoluteScrollStrategy, AutoPositionStrategy, OverlaySettings, PositionSettings, VerticalAlignment } from '../../services/public_api';
import { ColumnType, IGX_GRID_BASE, PivotGridType } from '../common/grid.interface';
import { IgxGridHeaderGroupComponent } from '../headers/grid-header-group.component';
import { IgxGridHeaderRowComponent } from '../headers/grid-header-row.component';
import { DropPosition } from '../moving/moving.service';
import { IgxPivotAggregate, IgxPivotDateAggregate, IgxPivotNumericAggregate, IgxPivotTimeAggregate } from './pivot-grid-aggregate';
import { IPivotAggregator, IPivotDimension, IPivotValue, PivotDimensionType } from './pivot-grid.interface';
import { PivotUtil } from './pivot-util';

/**
 *
 * For all intents & purposes treat this component as what a <thead> usually is in the default <table> element.
 *
 * This container holds the pivot grid header elements and their behavior/interactions.
 *
 * @hidden @internal
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'igx-pivot-header-row',
    templateUrl: './pivot-header-row.component.html'
})
export class IgxPivotHeaderRowComponent extends IgxGridHeaderRowComponent implements OnChanges {
    public aggregateList: IPivotAggregator[] = [];

    public value: IPivotValue;
    public filterDropdownDimensions: Set<any> = new Set<any>();
    public filterAreaDimensions: Set<any> = new Set<any>();
    private _dropPos = DropPosition.AfterDropTarget;
    private valueData: Map<string, IPivotAggregator[]>;
    private _subMenuPositionSettings: PositionSettings = {
        verticalStartPoint: VerticalAlignment.Bottom,
        closeAnimation: undefined
    };
    private _subMenuOverlaySettings: OverlaySettings = {
        closeOnOutsideClick: true,
        modal: false,
        positionStrategy: new AutoPositionStrategy(this._subMenuPositionSettings),
        scrollStrategy: new AbsoluteScrollStrategy()
    };

    /**
     * @hidden @internal
     */
    @ViewChild('esf') public esf: any;

    /**
     * @hidden @internal
     */
    @ViewChild('filterAreaHidden', { static: false }) public filterArea;

    /**
     * @hidden @internal
     */
    @ViewChild('filterIcon') public filtersButton;

    /**
     * @hidden @internal
     */
    @ViewChild('dropdownChips') public dropdownChips;

    /**
     * @hidden @internal
     */
    @ViewChild('pivotFilterContainer') public pivotFilterContainer;

    /**
    * @hidden
    * @internal
    */
    @ViewChildren('notifyChip')
    public notificationChips: QueryList<IgxChipComponent>;

    /**
    * @hidden
    * @internal
    * The virtualized part of the header row containing the unpinned header groups.
    */
    @ViewChildren('headerVirtualContainer', { read: IgxGridForOfDirective })
    public headerContainers: QueryList<IgxGridForOfDirective<IgxGridHeaderGroupComponent>>;

    public get headerForOf() {
        return this.headerContainers.last;
    }

    constructor(
        @Inject(IGX_GRID_BASE) public grid: PivotGridType,
        protected ref: ElementRef<HTMLElement>,
        protected cdr: ChangeDetectorRef,
        protected renderer: Renderer2,
    ) {
        super(ref, cdr);
    }

    /**
    * @hidden
    * @internal
    */
    public columnDimensionsByLevel: any[] = [];

    /**
    * @hidden @internal
    */
    public get isFiltersButton(): boolean {
        let chipsWidth = 0;
        this.filterDropdownDimensions.clear();
        this.filterAreaDimensions.clear();
        if (this.filterArea?.chipsList && this.filterArea.chipsList.length !== 0) {
            const styles = getComputedStyle(this.pivotFilterContainer.nativeElement);
            const containerPaddings = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
            chipsWidth += containerPaddings + (this.filtersButton ? this.filtersButton.el.nativeElement.getBoundingClientRect().width : 0);
            this.filterArea.chipsList.forEach(chip => {
                const dim = this.grid.filterDimensions.find(x => x.memberName === chip.id);
                if (dim) {
                    // 8 px margin between chips
                    const currentChipWidth = chip.nativeElement.getBoundingClientRect().width + 8;
                    if (chipsWidth + currentChipWidth < this.grid.pivotRowWidths) {
                        this.filterAreaDimensions.add(dim);
                    } else {
                        this.filterDropdownDimensions.add(dim);
                    }
                    chipsWidth += currentChipWidth;
                }
            });
            return this.filterDropdownDimensions.size > 0;
        }
        return false;
    }

    /**
    * @hidden
    * @internal
    */
    public get totalDepth() {
        const columnDimensions = this.grid.columnDimensions;
        if (columnDimensions.length === 0) {
            return 1;
        }
        let totalDepth = columnDimensions.map(x => PivotUtil.getDimensionDepth(x) + 1).reduce((acc, val) => acc + val);
        if (this.grid.hasMultipleValues) {
            totalDepth += 1;
        }
        return totalDepth;
    }

    /**
    * @hidden
    * @internal
    */
    public get maxContainerHeight() {
        return this.totalDepth > 1 ? this.totalDepth * this.grid.renderedRowHeight : undefined;
    }

    /**
    * @hidden
    * @internal
    */
    public calcHeight(col: ColumnType, index: number) {
        return !col.columnGroup && col.level < this.totalDepth && col.level === index ? (this.totalDepth - col.level) * this.grid.rowHeight : this.grid.rowHeight;
    }

    /**
    * @hidden
    * @internal
    */
    public isDuplicateOfExistingParent(col: ColumnType, lvl: number) {
        const parentCollection = lvl > 0 ? this.columnDimensionsByLevel[lvl - 1] : [];
        const duplicate = parentCollection.indexOf(col) !== -1;

        return duplicate;
    }

    /**
    * @hidden
    * @internal
    */
    public isMultiRow(col: ColumnType, lvl: number) {
        const isLeaf = !col.columnGroup;
        return isLeaf && lvl !== this.totalDepth - 1;
    }

    /**
    * @hidden
    * @internal
    */
    public populateColumnDimensionsByLevel() {
        const res = [];
        const columnDimensions = this.grid.columnDimensions;
        if (columnDimensions.length === 0) {
            this.columnDimensionsByLevel = res;
            return;
        }
        for (let i = 0; i < this.totalDepth; i++) {
            res[i] = [];
        }
        const cols = this.unpinnedColumnCollection;
        // populate column dimension matrix recursively
        this.populateDimensionRecursively(cols.filter(x => x.level === 0), 0, res);
        this.columnDimensionsByLevel = res;
    }

    protected populateDimensionRecursively(currentLevelColumns: ColumnType[], level = 0, res: any[]) {
        currentLevelColumns.forEach(col => {
            if (res[level]) {
                res[level].push(col);
                if (col.columnGroup && col.children.length > 0) {
                    const visibleColumns = col.children.toArray().filter(x => !x.hidden);
                    this.populateDimensionRecursively(visibleColumns, level + 1, res);
                } else if (level < this.totalDepth - 1) {
                    for (let i = level + 1; i <= this.totalDepth - 1; i++) {
                        res[i].push(col);
                    }
                }
            }
        });
    }

    /**
    * @hidden
    * @internal
    */
    public ngOnChanges(changes: SimpleChanges) {
        if (changes.unpinnedColumnCollection && this.unpinnedColumnCollection.length > 0) {
            this.populateColumnDimensionsByLevel();
        }
    }

    /**
    * @hidden
    * @internal
    */
    public onDimDragStart(event, area) {
        this.cdr.detectChanges();
        for (let chip of this.notificationChips) {
            if (area.chipsList.toArray().indexOf(chip) === -1 &&
                chip.nativeElement.parentElement.children.length > 0 &&
                chip.nativeElement.parentElement.children.item(0).id !== 'empty') {
                chip.nativeElement.hidden = false;
                chip.nativeElement.scrollIntoView();
            }
        }
    }

    /**
    * @hidden
    * @internal
    */
    public onDimDragEnd() {
        for (let chip of this.notificationChips) {
            chip.nativeElement.hidden = true;
        }
    }

    /**
    * @hidden
    * @internal
    */
    public getAreaHeight(area: IgxChipsAreaComponent) {
        const chips = area.chipsList;
        return chips && chips.length > 0 ? chips.first.nativeElement.clientHeight : 0;
    }

    /**
    * @hidden
    * @internal
    */
    public getAggregateList(val: IPivotValue): IPivotAggregator[] {
        if (!val.aggregateList) {
            let defaultAggr = this.getAggregatorsForValue(val);
            const isDefault = defaultAggr.find(x => x.key === val.aggregate.key);
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
    public rowRemoved(event: IBaseChipEventArgs) {
        const row = this.grid.pivotConfiguration.rows.find(x => x.memberName === event.owner.id);
        row.enabled = false;
        this.grid.pipeTrigger++;
        this.grid.filteringService.clearFilter(row.memberName);
        this.grid.dimensionsChange.emit({ dimensions: this.grid.pivotConfiguration.rows, dimensionCollectionType: PivotDimensionType.Row });
    }

    /**
    * @hidden
    * @internal
    */
    public columnRemoved(event: IBaseChipEventArgs) {
        const col = this.grid.pivotConfiguration.columns.find(x => x.memberName === event.owner.id);
        col.enabled = false;
        this.grid.setupColumns();
        this.grid.filteringService.clearFilter(col.memberName);
        this.grid.pipeTrigger++;
        this.grid.dimensionsChange.emit({ dimensions: this.grid.pivotConfiguration.columns, dimensionCollectionType: PivotDimensionType.Row });
        this.grid.reflow();
    }

    /**
    * @hidden
    * @internal
    */
    public valueRemoved(event: IBaseChipEventArgs) {
        const value = this.grid.pivotConfiguration.values.find(x => x.member === event.owner.id || x.displayName === event.owner.id);
        value.enabled = false;
        this.grid.setupColumns();
        this.grid.pipeTrigger++;
        this.grid.valuesChange.emit({ values: this.grid.pivotConfiguration.values });
    }

    /**
    * @hidden
    * @internal
    */
    public filterRemoved(event: IBaseChipEventArgs) {
        const filter = this.grid.pivotConfiguration.filters.find(x => x.memberName === event.owner.id);
        filter.enabled = false;
        this.grid.filteringService.clearFilter(filter.memberName);
        this.grid.pipeTrigger++;
        this.grid.dimensionsChange.emit({ dimensions: this.grid.pivotConfiguration.filters, dimensionCollectionType: PivotDimensionType.Filter });
        if (this.isFiltersButton && this.filterDropdownDimensions.has(filter)) {
            const selectedChip = this.dropdownChips.chipsList.find(x => x.selected);
            if (!selectedChip || selectedChip.id === event.owner.id) {
                this.dropdownChips.chipsList.first.selected = true;
            }
            this.filterDropdownDimensions.delete(filter)
            if (this.filterDropdownDimensions.size === 0) {
                this.grid.filteringService.hideESF();
            } else {
                this.onFiltersAreaDropdownClick({ target: this.filtersButton.el.nativeElement }, undefined, false);
            }
        } else {
            if (this.filterAreaDimensions.has(filter))  {
                this.filterAreaDimensions.delete(filter)
                this.grid.filteringService.hideESF();
            } else if (this.filterDropdownDimensions.size > 0) {
                this.onFiltersAreaDropdownClick({ target: this.filtersButton.el.nativeElement }, undefined, false);
            } else {
                this.grid.filteringService.hideESF();
            }
        }
    }

    public onFiltersSelectionChanged(event?: IBaseChipEventArgs) {
        this.dropdownChips.chipsList.forEach(chip => {
            if (chip.id !== event.owner.id) {
                chip.selected = false
            }
        });
        this.onFiltersAreaDropdownClick({ target: this.filtersButton.el.nativeElement }, this.grid.filterDimensions.find(dim => dim.memberName === event.owner.id), false);
    }

    /**
    * @hidden
    * @internal
    */
    public onFilteringIconPointerDown(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    /**
    * @hidden
    * @internal
    */
    public onFilteringIconClick(event, dimension) {
        event.stopPropagation();
        event.preventDefault();
        let dim = dimension;
        let col;
        while (dim) {
            col = this.grid.dimensionDataColumns.find(x => x.field === dim.memberName || x.field === dim.member);
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
    public onSummaryClick(eventArgs, value: IPivotValue, dropdown: IgxDropDownComponent, chip: IgxChipComponent) {
        this._subMenuOverlaySettings.target = eventArgs.currentTarget;
        if (dropdown.collapsed) {
            this.updateDropDown(value, dropdown, chip);
        } else {
            // close for previous chip
            dropdown.close();
            dropdown.closed.pipe(first()).subscribe(() => {
                this.updateDropDown(value, dropdown, chip);
            });
        }
    }

    /**
     * @hidden @internal
     */
    public onFiltersAreaDropdownClick(event, dimension?, shouldReattach = true) {
        let dim = dimension || this.filterDropdownDimensions.values().next().value;
        let col;
        while (dim) {
            col = this.grid.dimensionDataColumns.find(x => x.field === dim.memberName || x.field === dim.member);
            if (col) {
                break;
            } else {
                dim = dim.childLevel;
            }
        }
        if (shouldReattach) {
            this.dropdownChips.chipsList.forEach(chip => {
                chip.selected = false
            });
            this.dropdownChips.chipsList.first.selected = true;
        }
        this.grid.filteringService.toggleFiltersESF(this.esf, event.target, col, shouldReattach);
    }

    /**
    * @hidden
    * @internal
    */
    public onAggregationChange(event: ISelectionEventArgs) {
        if (!this.isSelected(event.newSelection.value)) {
            this.value.aggregate = event.newSelection.value;
            this.grid.pipeTrigger++;
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
    public onChipSort(event, dimension: IPivotDimension, dimensionType: PivotDimensionType) {
        if (!dimension.sortDirection) {
            dimension.sortDirection = SortingDirection.None;
        }
        dimension.sortDirection = dimension.sortDirection + 1 > SortingDirection.Desc ?
            SortingDirection.None : dimension.sortDirection + 1;
        // apply same sort direction to children.
        let dim = dimension;
        while (dim.childLevel) {
            dim.childLevel.sortDirection = dimension.sortDirection;
            dim = dim.childLevel;
        }
        this.grid.pipeTrigger++;
        if (dimensionType === PivotDimensionType.Column) {
            this.grid.setupColumns();
        }
    }

    /**
    * @hidden
    * @internal
    */
    public onDimDragOver(event, dimension?: PivotDimensionType) {
        const typeMismatch = dimension !== undefined ? this.grid.pivotConfiguration.values.find(x => x.member === event.dragChip.id
            || x.displayName === event.dragChip.id) :
            !this.grid.pivotConfiguration.values.find(x => x.member === event.dragChip.id || x.displayName === event.dragChip.id);
        if (typeMismatch) {
            // cannot drag between dimensions and value
            return;
        }
        // if we are in the left half of the chip, drop on the left
        // else drop on the right of the chip
        const clientRect = event.owner.nativeElement.getBoundingClientRect();
        const pos = clientRect.width / 2;

        this._dropPos = event.originalEvent.offsetX > pos ? DropPosition.AfterDropTarget : DropPosition.BeforeDropTarget;
        if (this._dropPos === DropPosition.AfterDropTarget) {
            event.owner.nativeElement.previousElementSibling.style.visibility = 'hidden';
            event.owner.nativeElement.nextElementSibling.style.visibility = '';
        } else {
            event.owner.nativeElement.nextElementSibling.style.visibility = 'hidden';
            event.owner.nativeElement.previousElementSibling.style.visibility = '';
        }
    }

    /**
    * @hidden
    * @internal
    */
    public onDimDragLeave(event) {
        event.owner.nativeElement.previousElementSibling.style.visibility = 'hidden';
        event.owner.nativeElement.nextElementSibling.style.visibility = 'hidden';
        this._dropPos = DropPosition.AfterDropTarget;
    }

    /**
    * @hidden
    * @internal
    */
    public onAreaDragLeave(event, area) {
        const dataChips = area.chipsList.toArray().filter(x => this.notificationChips.toArray().indexOf(x) === -1);
        dataChips.forEach(element => {
            if (element.nativeElement.previousElementSibling) {
                element.nativeElement.previousElementSibling.style.visibility = 'hidden';
            }
            if (element.nativeElement.nextElementSibling) {
                element.nativeElement.nextElementSibling.style.visibility = 'hidden';
            }
        });
    }

    /**
    * @hidden
    * @internal
    */
    public onValueDrop(event, area) {
        //values can only be reordered
        const currentDim = this.grid.pivotConfiguration.values;
        const dragId = event.dragChip?.id || event.dragData?.chip.id;
        const chipsArray = area.chipsList.toArray();
        let chipIndex = chipsArray.indexOf(event.owner) !== -1 ? chipsArray.indexOf(event.owner) : chipsArray.length;
        chipIndex = this._dropPos === DropPosition.AfterDropTarget ? chipIndex + 1 : chipIndex;
        const newDim = currentDim.find(x => x.member === dragId || x.displayName === dragId);
        if (newDim) {
            const dragChipIndex = chipsArray.indexOf(event.dragChip || event.dragData.chip);
            currentDim.splice(dragChipIndex, 1);
            currentDim.splice(dragChipIndex >= chipIndex ? chipIndex : chipIndex - 1, 0, newDim);
            this.grid.setupColumns();
            this.grid.valuesChange.emit({ values: this.grid.pivotConfiguration.values });
        }
    }

    /**
    * @hidden
    * @internal
    */
    public onDimDrop(event, area, dimension: PivotDimensionType) {
        const dragId = event.dragChip?.id || event.dragData?.chip.id;
        const isFromFiltering = this.grid.filterDimensions.find(x => x.memberName === dragId);
        const currentDim = this.getDimensionsByType(dimension);
        const chipsArray = area.chipsList.toArray();
        const chip = chipsArray.find(x => x.id === dragId);
        const isNewChip = chip === undefined;
        const isReorder = event.owner.id !== undefined;
        //const chipIndex = chipsArray.indexOf(event.owner) !== -1 ? chipsArray.indexOf(event.owner) : chipsArray.length;
        const chipIndex = currentDim.findIndex(x => x.memberName === event.owner.id) !== -1 ?
            currentDim.findIndex(x => x.memberName === event.owner.id) : currentDim.length;
        const targetIndex = this._dropPos === DropPosition.AfterDropTarget ? chipIndex + 1 : chipIndex;
        if (isNewChip) {
            const allDims = this.grid.pivotConfiguration.rows
                .concat(this.grid.pivotConfiguration.columns)
                .concat(this.grid.pivotConfiguration.filters);
            // chip moved from external collection
            const dim = allDims.find(x => x && x.memberName === dragId);
            if (!dim) {
                // you have dragged something that is not a dimension
                return;
            }
            const dimType = this.getDimensionsType(dim);

            // Dragged chip from a different dimension to the current one.
            const prevDimensionCollection = this.getDimensionsByType(dimType);
            // delete from previous dimension collection and add to current.
            prevDimensionCollection.splice(prevDimensionCollection.indexOf(dim), 1);
            currentDim.splice(targetIndex, 0, dim);

            const isDraggedFromColumn = !!this.grid.pivotConfiguration.columns?.find(x => x && x.memberName === dragId);
            if (isDraggedFromColumn) {
                // columns have changed.
                this.grid.setupColumns();
            }
        } else if (isReorder) {
            // chip from same collection, reordered.
            const newDim = currentDim.find(x => x.memberName === dragId);
            //const dragChipIndex = chipsArray.indexOf(event.dragChip || event.dragData.chip);
            const dragChipIndex = currentDim.findIndex(x => x.memberName === dragId);
            currentDim.splice(dragChipIndex, 1);
            currentDim.splice(dragChipIndex > chipIndex ? targetIndex : targetIndex - 1, 0, newDim);
        }
        if (dimension === PivotDimensionType.Column) {
            // if columns have changed need to regenerate columns.
            this.grid.setupColumns();
        }
        if (isFromFiltering || dimension === PivotDimensionType.Filter) {
            this.grid.reflow();
        }
        this.grid.pipeTrigger++;
        this.grid.dimensionsChange.emit({ dimensions: currentDim, dimensionCollectionType: dimension });
        // clean states
        this.onDimDragEnd();
        this.onAreaDragLeave(event, area);
    }

    protected getDimensionsByType(dimension: PivotDimensionType) {
        switch (dimension) {
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

    protected getDimensionsType(dimension: IPivotDimension) {
        const isColumn = !!this.grid.pivotConfiguration.columns?.find(x => x && x.memberName === dimension.memberName);
        const isRow = !!this.grid.pivotConfiguration.rows?.find(x => x && x.memberName === dimension.memberName);
        return isColumn ? PivotDimensionType.Column : isRow ? PivotDimensionType.Row : PivotDimensionType.Filter;
    }

    protected getAggregatorsForValue(value: IPivotValue): IPivotAggregator[] {
        const dataType = value.dataType || this.grid.resolveDataTypes(this.grid.data[0][value.member]);
        switch (dataType) {
            case GridColumnDataType.Number:
            case GridColumnDataType.Currency:
                return IgxPivotNumericAggregate.aggregators();
            case GridColumnDataType.Date:
            case GridColumnDataType.DateTime:
                return IgxPivotDateAggregate.aggregators();
            case GridColumnDataType.Time:
                return IgxPivotTimeAggregate.aggregators();
            default:
                return IgxPivotAggregate.aggregators();
        }
    }

    protected updateDropDown(value: IPivotValue, dropdown: IgxDropDownComponent, chip: IgxChipComponent) {
        this.value = value;
        dropdown.width = chip.nativeElement.clientWidth + 'px';
        this.aggregateList = this.getAggregateList(value);
        dropdown.open(this._subMenuOverlaySettings);
    }
}
