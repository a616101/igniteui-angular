import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { cloneArray, isEqual, mergeObjects } from '../core/utils';
import { DataUtil, DataType } from '../data-operations/data-util';
import { IFilteringExpression } from '../data-operations/filtering-expression.interface';
import { ISortingExpression, SortingDirection } from '../data-operations/sorting-expression.interface';
import { IgxGridCellComponent } from './cell.component';
import { IgxGridBaseDirective } from './grid-base.directive';
import { IgxRowDirective } from './row.directive';
import { IFilteringOperation } from '../data-operations/filtering-condition';
import { IFilteringExpressionsTree, FilteringExpressionsTree } from '../data-operations/filtering-expressions-tree';
import { Transaction, TransactionType, State } from '../services/transaction/transaction';
import { IgxCell, IgxRow } from './selection/selection.service';
import { GridType } from './common/grid.interface';
import { ColumnType } from './common/column.interface';
/**
 *@hidden
 */
@Injectable()
export class GridBaseAPIService <T extends IgxGridBaseDirective & GridType> {

    grid: T;
    protected destroyMap: Map<string, Subject<boolean>> = new Map<string, Subject<boolean>>();

    public get_column_by_name(name: string): ColumnType {
        return this.grid.columnList.find((col: ColumnType) => col.field === name);
    }

    public get_summary_data() {
        const grid = this.grid;
        let data = grid.filteredData;
        if (!data) {
            if (grid.transactions.enabled) {
                data = DataUtil.mergeTransactions(
                    cloneArray(grid.data),
                    grid.transactions.getAggregatedChanges(true),
                    grid.primaryKey
                );
                const deletedRows = grid.transactions.getTransactionLog().filter(t => t.type === TransactionType.DELETE).map(t => t.id);
                deletedRows.forEach(rowID => {
                    const tempData = grid.primaryKey ? data.map(rec => rec[grid.primaryKey]) : data;
                    const index = tempData.indexOf(rowID);
                    if (index !== -1) {
                       data.splice(index, 1);
                    }
                });
            } else {
                data = grid.data;
            }
        }
        return data;
    }

    /**
     * @hidden
     * @internal
     */
    public getRowData(rowID: any) {
        const data = this.get_all_data(this.grid.transactions.enabled);
        const index = this.get_row_index_in_data(rowID);
        return data[index];
    }

    // TODO: Refactor
    public escape_editMode() {
        this.grid.crudService.end();
    }

    // TODO: Refactor
    public get_cell_inEditMode(): IgxCell {
        return this.grid.crudService.cell;
    }

    public get_row_index_in_data(rowID: any): number {
        const grid = this.grid as IgxGridBaseDirective;
        if (!grid) {
            return -1;
        }
        const data = this.get_all_data(grid.transactions.enabled);
        return grid.primaryKey ? data.findIndex(record => record[grid.primaryKey] === rowID) : data.indexOf(rowID);
    }

    public get_row_by_key(rowSelector: any): IgxRowDirective<IgxGridBaseDirective & GridType> {
        const primaryKey = this.grid.primaryKey;
        if (primaryKey !== undefined && primaryKey !== null) {
            return this.grid.dataRowList.find((row) => row.rowData[primaryKey] === rowSelector);
        } else {
            return this.grid.dataRowList.find((row) => row.rowData === rowSelector);
        }
    }

    public get_row_by_index(rowIndex: number): IgxRowDirective<IgxGridBaseDirective & GridType> {
        return this.grid.rowList.find((row) => row.index === rowIndex);
    }

    public get_cell_by_key(rowSelector: any, field: string): IgxGridCellComponent {
        const row = this.get_row_by_key(rowSelector);
        if (row && row.cells) {
            return row.cells.find((cell) => cell.column.field === field);
        }
    }

    public get_cell_by_index(rowIndex: number, columnIndex: number): IgxGridCellComponent {
        const row = this.get_row_by_index(rowIndex);
        if (row && row.cells) {
            return row.cells.find((cell) => cell.columnIndex === columnIndex);
        }
    }

    public get_cell_by_visible_index(rowIndex: number, columnIndex: number): IgxGridCellComponent {
        const row = this.get_row_by_index(rowIndex);
        if (row && row.cells) {
            return row.cells.find((cell) => cell.visibleColumnIndex === columnIndex);
        }
    }

    public submit_value() {
        const cell = this.grid.crudService.cell;
        if (cell ) {
            const args = this.update_cell(cell, cell.editValue);
            if (args.cancel) {
                return;
            }
            this.escape_editMode();
        }
    }

    update_cell(cell: IgxCell, value: any) {
        const data = this.get_all_data(this.grid.transactions.enabled);
        const index = this.get_row_index_in_data(cell.id.rowID);

        cell.editValue = value;

        const args = cell.createEditEventArgs();

        this.grid.onCellEdit.emit(args);
        if (args.cancel) {
            return args;
        }

        // Cast to number after emit
        // TODO: Clean up this
        args.newValue = cell.castToNumber(args.newValue);

        if (isEqual(args.oldValue, args.newValue)) {
            return args;
        }

        this.grid.summaryService.clearSummaryCache(args);
        this.updateData(this.grid, cell.id.rowID, data[index], cell.rowData, { [cell.column.field ]: args.newValue });
        if (this.grid.primaryKey === cell.column.field) {
             if (this.grid.selectionService.isRowSelected(cell.id.rowID)) {
                this.grid.selectionService.deselectRow(cell.id.rowID);
                this.grid.selectionService.selectRowById(args.newValue);
            }
            if (this.grid.hasSummarizedColumns) {
                this.grid.summaryService.removeSummaries(cell.id.rowID);
            }
        }
        if (!this.grid.rowEditable || !this.grid.crudService.row ||
                this.grid.crudService.row.id !== cell.id.rowID || !this.grid.transactions.enabled) {
            this.grid.summaryService.clearSummaryCache(args);
            (this.grid as any)._pipeTrigger++;
        }

        return args;
    }

    /**
     * Updates related row of provided grid's data source with provided new row value
     * @param grid Grid to update data for
     * @param rowID ID of the row to update
     * @param rowValueInDataSource Initial value of the row as it is in data source
     * @param rowCurrentValue Current value of the row as it is with applied previous transactions
     * @param rowNewValue New value of the row
     */
    protected updateData(grid, rowID, rowValueInDataSource: any, rowCurrentValue: any, rowNewValue: {[x: string]: any}) {
        if (grid.transactions.enabled) {
            const transaction: Transaction = {
                id: rowID,
                type: TransactionType.UPDATE,
                newValue: rowNewValue
            };
            grid.transactions.add(transaction, rowCurrentValue);
        } else {
            mergeObjects(rowValueInDataSource, rowNewValue);
        }
    }

    _update_row(row: IgxRow, value?: any) {
        const grid = this.grid;

        const rowInEditMode = grid.crudService.row;
        row.newData = value ? value : grid.transactions.getAggregatedValue(row.id, true);


        if (rowInEditMode && row.id === rowInEditMode.id) {
            row.data = { ...row.data, ...rowInEditMode.transactionState };
        // TODO: Workaround for updating a row in edit mode through the API
        } else if (this.grid.transactions.enabled) {
            const state = grid.transactions.getState(row.id);
            row.data = state ? Object.assign({}, row.data, state.value) : row.data;
        }
    }

    update_row(row: IgxRow, value: any) {
        const grid = this.grid;
        const selected = grid.selectionService.isRowSelected(row.id);
        const rowInEditMode = grid.crudService.row;
        const data = this.get_all_data(grid.transactions.enabled);
        const index = this.get_row_index_in_data(row.id);
        const hasSummarized = grid.hasSummarizedColumns;

        this._update_row(row, value);

        const args = row.createEditEventArgs();

        // If no valid row is found
        if (index === -1) {
            return args;
        }

        grid.onRowEdit.emit(args);

        if (args.cancel) {
            return args;
        }

        if (rowInEditMode) {
            const hasChanges = grid.transactions.getState(args.rowID, true);
            grid.transactions.endPending(false);
            if (!hasChanges) {
                return args;
            }
        }

        if (!args.newValue) {
            return args;
        }

        if (hasSummarized) {
            grid.summaryService.removeSummaries(args.rowID);
        }

        this.updateData(grid, row.id, data[index], args.oldValue, args.newValue);
        const newId = grid.primaryKey ? args.newValue[grid.primaryKey] : args.newValue;
        if (selected) {
            grid.selectionService.deselectRow(row.id);
            grid.selectionService.selectRowById(newId);
        }
        if (hasSummarized) {
            grid.summaryService.removeSummaries(newId);
        }
        (grid as any)._pipeTrigger++;

        return args;
    }



    protected update_row_in_array(value: any, rowID: any, index: number) {
        const grid = this.grid;
        grid.data[index] = value;
    }

    public sort(expression: ISortingExpression): void {
        if (expression.dir === SortingDirection.None) {
            this.remove_grouping_expression(expression.fieldName);
        }
        const sortingState = cloneArray(this.grid.sortingExpressions);
        this.prepare_sorting_expression([sortingState], expression);
        this.grid.sortingExpressions = sortingState;
    }

    public sort_multiple(expressions: ISortingExpression[]): void {
        const sortingState = cloneArray(this.grid.sortingExpressions);

        for (const each of expressions) {
            if (each.dir === SortingDirection.None) {
                this.remove_grouping_expression(each.fieldName);
            }
            this.prepare_sorting_expression([sortingState], each);
        }

        this.grid.sortingExpressions = sortingState;
    }

    public filter(fieldName: string, term, conditionOrExpressionsTree: IFilteringOperation | IFilteringExpressionsTree,
        ignoreCase: boolean) {
        const grid = this.grid;
        const filteringTree = grid.filteringExpressionsTree;
        grid.endEdit(false);

        if (grid.paging) {
            grid.page = 0;
        }

        const fieldFilterIndex = filteringTree.findIndex(fieldName);
        if (fieldFilterIndex > -1) {
            filteringTree.filteringOperands.splice(fieldFilterIndex, 1);
        }

        this.prepare_filtering_expression(filteringTree, fieldName, term, conditionOrExpressionsTree, ignoreCase, fieldFilterIndex);
        grid.filteringExpressionsTree = filteringTree;
    }

    public filter_global(term, condition, ignoreCase) {
        if (!condition) {
            return;
        }

        const grid = this.grid;
        const filteringTree = grid.filteringExpressionsTree;
        grid.endEdit(false);
        if (grid.paging) {
            grid.page = 0;
        }

        filteringTree.filteringOperands = [];
        for (const column of grid.columns) {
            this.prepare_filtering_expression(filteringTree, column.field, term,
                condition, ignoreCase || column.filteringIgnoreCase);
        }

        grid.filteringExpressionsTree = filteringTree;
    }

    public clear_filter(fieldName: string) {
        const grid = this.grid;
        grid.endEdit(false);
        const filteringState = grid.filteringExpressionsTree;
        const index = filteringState.findIndex(fieldName);

        if (index > -1) {
            filteringState.filteringOperands.splice(index, 1);
        } else if (!fieldName) {
            filteringState.filteringOperands = [];
        }

        grid.filteringExpressionsTree = filteringState;
    }

    public clear_sort(fieldName: string) {
        const sortingState = this.grid.sortingExpressions;
        const index = sortingState.findIndex((expr) => expr.fieldName === fieldName);
        if (index > -1) {
            sortingState.splice(index, 1);
            this.grid.sortingExpressions = sortingState;
        }
    }

    protected prepare_filtering_expression(filteringState: IFilteringExpressionsTree, fieldName: string, searchVal,
        conditionOrExpressionsTree: IFilteringOperation | IFilteringExpressionsTree, ignoreCase: boolean, insertAtIndex = -1) {

        let newExpressionsTree;
        const oldExpressionsTreeIndex = filteringState.findIndex(fieldName);
        const expressionsTree = conditionOrExpressionsTree instanceof FilteringExpressionsTree ?
            conditionOrExpressionsTree as IFilteringExpressionsTree : null;
        const condition = conditionOrExpressionsTree instanceof FilteringExpressionsTree ?
            null : conditionOrExpressionsTree as IFilteringOperation;
        const newExpression: IFilteringExpression = { fieldName, searchVal, condition, ignoreCase };

        if (oldExpressionsTreeIndex === -1) {
            // no expressions tree found for this field
            if (expressionsTree) {
                if (insertAtIndex > -1) {
                    filteringState.filteringOperands.splice(insertAtIndex, 0, expressionsTree);
                } else {
                    filteringState.filteringOperands.push(expressionsTree);
                }
            } else if (condition) {
                // create expressions tree for this field and add the new expression to it
                newExpressionsTree = new FilteringExpressionsTree(filteringState.operator, fieldName);
                newExpressionsTree.filteringOperands.push(newExpression);
                filteringState.filteringOperands.push(newExpressionsTree);
            }
        }
    }

    protected prepare_sorting_expression(stateCollections: Array<Array<any>>, expression: ISortingExpression) {
        if (expression.dir === SortingDirection.None) {
            stateCollections.forEach(state => {
                state.splice(state.findIndex((expr) => expr.fieldName === expression.fieldName), 1);
            });
            return;
        }

        /**
         * We need to make sure the states in each collection with same fields point to the same object reference.
         * If the different state collections provided have different sizes we need to get the largest one.
         * That way we can get the state reference from the largest one that has the same fieldName as the expression to prepare.
         */
        let maxCollection = stateCollections[0];
        for (let i = 1; i < stateCollections.length; i++) {
            if (maxCollection.length < stateCollections[i].length) {
                maxCollection = stateCollections[i];
            }
        }
        const maxExpr = maxCollection.find((expr) => expr.fieldName === expression.fieldName);

        stateCollections.forEach(collection => {
            const myExpr = collection.find((expr) => expr.fieldName === expression.fieldName);
            if (!myExpr && !maxExpr) {
                // Expression with this fieldName is missing from the current and the max collection.
                collection.push(expression);
            } else if (!myExpr && maxExpr) {
                // Expression with this fieldName is missing from the current and but the max collection has.
                collection.push(maxExpr);
                Object.assign(maxExpr, expression);
            } else {
                // The current collection has the expression so just update it.
                Object.assign(myExpr, expression);
            }
        });
    }

    protected remove_grouping_expression(fieldName) {
    }

    public clear_groupby(name?: string | Array<string>) {
    }

    public should_apply_number_style(column: ColumnType): boolean {
        return column.dataType === DataType.Number;
    }

    public get_data(): any[] {
        const grid = this.grid;
        const data = grid.data ? grid.data : [];
        return data;
    }

    public get_all_data(includeTransactions = false): any[] {
        const grid = this.grid;
        let data = grid.data ? grid.data : [];
        data = includeTransactions ? grid.dataWithAddedInTransactionRows : data;
        return data;
    }

    public get_filtered_data(): any[] {
        return this.grid.filteredData;
    }

    protected getSortStrategyPerColumn(fieldName: string) {
        return this.get_column_by_name(fieldName) ?
            this.get_column_by_name(fieldName).sortStrategy : undefined;
    }

    public addRowToData(rowData: any) {
        // Add row goes to transactions and if rowEditable is properly implemented, added rows will go to pending transactions
        // If there is a row in edit - > commit and close
        const grid = this.grid;
        if (grid.transactions.enabled) {
            const transactionId = grid.primaryKey ? rowData[grid.primaryKey] : rowData;
            const transaction: Transaction = { id: transactionId, type: TransactionType.ADD, newValue: rowData };
            grid.transactions.add(transaction);
        } else {
            grid.data.push(rowData);
        }
    }

    public deleteRowFromData(rowID: any, index: number) {
        //  if there is a row (index !== 0) delete it
        //  if there is a row in ADD or UPDATE state change it's state to DELETE
        const grid = this.grid;
        if (index !== -1) {
            if (grid.transactions.enabled) {
                const transaction: Transaction = { id: rowID, type: TransactionType.DELETE, newValue: null };
                grid.transactions.add(transaction, grid.data[index]);
            } else {
                grid.data.splice(index, 1);
            }
        } else {
            const state: State = grid.transactions.getState(rowID);
            grid.transactions.add({ id: rowID, type: TransactionType.DELETE, newValue: null }, state && state.recordRef);
        }
    }

    public deleteRowById(rowId: any) {
        let index: number;
        const grid = this.grid;
        const data = this.get_all_data();
        if (grid.primaryKey) {
            index = data.map((record) => record[grid.primaryKey]).indexOf(rowId);
        } else {
            index = data.indexOf(rowId);
        }
        const state: State = grid.transactions.getState(rowId);
        const hasRowInNonDeletedState = state && state.type !== TransactionType.DELETE;

        //  if there is a row (index !== -1) and the we have cell in edit mode on same row exit edit mode
        //  if there is no row (index === -1), but there is a row in ADD or UPDATE state do as above
        //  Otherwise just exit - there is nothing to delete
        if (index !== -1 || hasRowInNonDeletedState) {
            // Always exit edit when row is deleted
            grid.endEdit(true);
        } else {
            return;
        }

        //  TODO: should we emit this when cascadeOnDelete is true for each row?!?!
        grid.onRowDeleted.emit({ data: data[index] });

        this.deleteRowFromData(rowId, index);

        grid.selectionService.isRowSelected(rowId) ? grid.selectionService.deselectRow(rowId) : grid.selectionService.clearHeaderCBState();
        (grid as any)._pipeTrigger++;
        grid.notifyChanges();
        // Data needs to be recalculated if transactions are in place
        // If no transactions, `data` will be a reference to the grid getter, otherwise it will be stale
        const dataAfterDelete = grid.transactions.enabled ? grid.dataWithAddedInTransactionRows : data;
        grid.refreshSearch();
        if (dataAfterDelete.length % grid.perPage === 0 && dataAfterDelete.length / grid.perPage - 1 < grid.page && grid.page !== 0) {
            grid.page--;
        }
    }

    public get_row_id(rowData) {
        return this.grid.primaryKey ? rowData[this.grid.primaryKey] : rowData;
    }

    public row_deleted_transaction(rowID: any): boolean {
        const grid = this.grid;
        if (!grid) {
            return false;
        }
        if (!grid.transactions.enabled) {
            return false;
        }
        const state = grid.transactions.getState(rowID);
        if (state) {
            return state.type === TransactionType.DELETE;
        }

        return false;
    }

    public atInexistingPage(): boolean {
        return this.grid.totalPages - 1 > this.grid.page;
    }
}
