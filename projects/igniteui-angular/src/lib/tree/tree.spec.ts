import { AnimationBuilder } from '@angular/animations';
import { Component, ElementRef, ViewChild, QueryList, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { IDisplayDensityOptions } from '../core/displayDensity';
import { configureTestSuite } from '../test-utils/configure-suite';
import { TreeTestFunctions } from './tree-functions.spec';
import { IgxTreeNavigationService } from './tree-navigation.service';
import { IgxTreeNodeComponent } from './tree-node/tree-node.component';
import { IgxTreeSelectionService } from './tree-selection.service';
import { IgxTreeComponent, IgxTreeModule } from './tree.component';
import { IgxTreeService } from './tree.service';

describe('IgxTree #treeView', () => {
    configureTestSuite();
    let mockNavService: IgxTreeNavigationService;
    let mockTreeService: IgxTreeService;
    let mockSelectionService: IgxTreeSelectionService;
    let mockElementRef: ElementRef<any>;
    let mockDisplayDensity: IDisplayDensityOptions;
    let mockNodes: QueryList<IgxTreeNodeComponent<any>>;
    let mockNodesArray: IgxTreeNodeComponent<any>[] = [];
    let tree: IgxTreeComponent = null;
    beforeAll(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [
                    IgxTreeSampleComponent,],
                imports: [
                    NoopAnimationsModule,
                    IgxTreeModule
                ]
            }).compileComponents();
        })
    );
    beforeEach(() => {
        mockNodesArray = [];
        mockNavService = jasmine.createSpyObj('navService',
            ['register', 'update_disabled_cache', 'update_visible_cache',
                'init_invisible_cache', 'setFocusedAndActiveNode', 'handleKeydown']);
        mockTreeService = jasmine.createSpyObj('treeService',
            ['register', 'collapse', 'expand', 'collapsing', 'isExpanded']);
        mockSelectionService = jasmine.createSpyObj('selectionService',
            ['register', 'deselectNodesWithNoEvent']);
        mockElementRef = jasmine.createSpyObj('elementRef', [], {
            nativeElement: jasmine.createSpyObj('nativeElement', ['focus'], {})
        });
        tree = new IgxTreeComponent(mockNavService, mockSelectionService, mockTreeService, mockElementRef);
        mockNodes = jasmine.createSpyObj('mockList', ['toArray'], {
            changes: new Subject<void>(),
            get first() {
                return mockNodesArray[0];
            },
            get last() {
                return mockNodesArray[mockNodesArray.length - 1];
            },
            get length() {
                return mockNodesArray.length;
            },
            forEach: (cb: (n: IgxTreeNodeComponent<any>) => void): void => {
                mockNodesArray.forEach(cb);
            },
            find: (cb: (n: IgxTreeNodeComponent<any>) => boolean): IgxTreeNodeComponent<any> => mockNodesArray.find(cb),
            filter: jasmine.createSpy('filter').
                and.callFake((cb: (n: IgxTreeNodeComponent<any>) => boolean): IgxTreeNodeComponent<any>[] => mockNodesArray.filter(cb)),
        });
        spyOn(mockNodes, 'toArray').and.returnValue(mockNodesArray);
    });
    describe('Unit Tests', () => {
        describe('IgxTreeComponent', () => {
            it('Should update nav children cache when events are fired', fakeAsync(() => {
                expect(mockNavService.init_invisible_cache).toHaveBeenCalledTimes(0);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledTimes(0);
                expect(mockNavService.update_disabled_cache).toHaveBeenCalledTimes(0);
                tree.ngOnInit();
                tick();
                expect(mockNavService.init_invisible_cache).toHaveBeenCalledTimes(0);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledTimes(0);
                expect(mockNavService.update_disabled_cache).toHaveBeenCalledTimes(0);
                tree.disabledChange.emit('mockNode' as any);
                tick();
                expect(mockNavService.update_disabled_cache).toHaveBeenCalledTimes(1);
                expect(mockNavService.update_disabled_cache).toHaveBeenCalledWith('mockNode' as any);
                tree.nodeCollapsing.emit({ node: 'mockNode' as any } as any);
                tick();
                expect(mockNavService.update_visible_cache).toHaveBeenCalledTimes(1);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledWith('mockNode' as any, false);
                tree.nodeExpanding.emit({ node: 'mockNode' as any } as any);
                tick();
                expect(mockNavService.update_visible_cache).toHaveBeenCalledTimes(2);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledWith('mockNode' as any, true);
                tree.nodes = mockNodes;
                const mockNode = TreeTestFunctions.createNodeSpy({
                    expandedChange: new EventEmitter<void>(),
                    closeAnimationDone: new EventEmitter<void>(),
                    openAnimationDone: new EventEmitter<void>()
                }) as any;
                mockNodesArray.push(
                    mockNode
                );
                console.log(mockNodesArray);
                console.log(mockNodesArray[0]);
                spyOnProperty(mockNodes, 'first', 'get').and.returnValue(mockNode);
                tree.ngAfterViewInit();
                tick();
                expect(mockNavService.init_invisible_cache).toHaveBeenCalledTimes(1);
                tree.nodes.first.expandedChange.emit(true);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledTimes(3);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledWith(tree.nodes.first, true);
                tree.nodes.first.expandedChange.emit(false);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledTimes(4);
                expect(mockNavService.update_visible_cache).toHaveBeenCalledWith(tree.nodes.first, false);
                (tree.nodes.changes as any).next();
                tick();
                expect(mockNavService.init_invisible_cache).toHaveBeenCalledTimes(2);
                tree.ngOnDestroy();
            }));
            it('Should update delegate keyboard events to nav service', () => {
                const mockEvent: any = {};
                tree.handleKeydown(mockEvent as any);
                expect(mockNavService.handleKeydown).toHaveBeenCalledWith(mockEvent as any);
            });
            it('Should search through nodes and return expected value w/ `findNodes`', () => {
                tree.nodes = mockNodes;
                let id = 0;
                let itemRef = {} as any;
                mockNodesArray = TreeTestFunctions.createNodeSpies(5);
                mockNodesArray.forEach(n => {
                    itemRef = { id: id++ };
                    n.data = itemRef;
                });
                expect(tree.findNodes(itemRef)).toEqual([mockNodesArray[mockNodesArray.length - 1]]);
                expect(tree.nodes.filter).toHaveBeenCalledTimes(1);
                expect(tree.findNodes(1, (p, n) => n.data.id === p)).toEqual([mockNodes.find(n => n.data.id === 1)]);
                expect(tree.nodes.filter).toHaveBeenCalledTimes(2);
                expect(tree.findNodes('Not found', (p, n) => n.data.id === p)).toEqual(null);
                expect(tree.nodes.filter).toHaveBeenCalledTimes(3);

            });
            it('Should return only root level nodes w/ `rootNodes` accessor', () => {
                tree.nodes = mockNodes;
                const arr = [];
                for (let i = 0; i < 7; i++) {
                    const level = i > 4 ? 1 : 0;
                    arr.push({
                        level
                    });
                }
                mockNodesArray = [...arr];
                expect(tree.rootNodes.length).toBe(5);
                mockNodesArray.forEach(n => {
                    (n as any).level = 1;
                });
                expect(tree.rootNodes.length).toBe(0);
                mockNodesArray.forEach(n => {
                    (n as any).level = 0;
                });
                expect(tree.rootNodes.length).toBe(7);
            });
            it('Should expandAll nodes nodes w/ proper methods', () => {
                tree.nodes = mockNodes;
                const customArrayParam = [];
                for (let i = 0; i < 5; i++) {
                    const node = jasmine.createSpyObj('node', ['expand', 'collapse'], {
                        _expanded: false,
                        get expanded() {
                            return this._expanded;
                        },
                        set expanded(val: boolean) {
                            this._expanded = val;
                        }
                    });
                    node.spyProp = spyOnProperty(node, 'expanded', 'set').and.callThrough();
                    mockNodesArray.push(node);
                    if (i > 3) {
                        customArrayParam.push(node);
                    }
                }
                spyOn(mockNodesArray, 'forEach').and.callThrough();
                tree.expandAll();
                expect(mockNodesArray.forEach).toHaveBeenCalledTimes(1);
                mockNodesArray.forEach(n => {
                    expect((n as any).spyProp).toHaveBeenCalledWith(true);
                    expect((n as any).spyProp).toHaveBeenCalledTimes(1);
                });
                tree.expandAll(customArrayParam);
                customArrayParam.forEach(n => {
                    expect((n as any).spyProp).toHaveBeenCalledWith(true);
                    expect((n as any).spyProp).toHaveBeenCalledTimes(2);
                });
            });
            it('Should collapseAll nodes nodes w/ proper methods', () => {
                tree.nodes = mockNodes;
                const customArrayParam = [];
                for (let i = 0; i < 5; i++) {
                    const node = jasmine.createSpyObj('node', ['expand', 'collapse'], {
                        _expanded: false,
                        get expanded() {
                            return this._expanded;
                        },
                        set expanded(val: boolean) {
                            this._expanded = val;
                        }
                    });
                    node.spyProp = spyOnProperty(node, 'expanded', 'set').and.callThrough();
                    mockNodesArray.push(node);
                    if (i > 3) {
                        customArrayParam.push(node);
                    }
                }
                spyOn(mockNodesArray, 'forEach').and.callThrough();
                tree.collapseAll();
                expect(mockNodesArray.forEach).toHaveBeenCalledTimes(1);
                mockNodesArray.forEach(n => {
                    expect((n as any).spyProp).toHaveBeenCalledWith(false);
                    expect((n as any).spyProp).toHaveBeenCalledTimes(1);
                });
                tree.collapseAll(customArrayParam);
                customArrayParam.forEach(n => {
                    expect((n as any).spyProp).toHaveBeenCalledWith(false);
                    expect((n as any).spyProp).toHaveBeenCalledTimes(2);
                });
            });
            it('Should deselectAll nodes w/ proper methond', () => {
                tree.nodes = mockNodes;
                tree.deselectAll();
                expect(mockSelectionService.deselectNodesWithNoEvent).toHaveBeenCalledWith(undefined);
                const customParam = jasmine.createSpyObj<any>('nodes', ['toArray']);
                tree.deselectAll(customParam);
                expect(mockSelectionService.deselectNodesWithNoEvent).toHaveBeenCalledWith(customParam);
            });
        });
        describe('IgxTreeNodeComponent', () => {
            let mockTree: IgxTreeComponent;
            let mockCdr: ChangeDetectorRef;
            let mockBuilder: AnimationBuilder;

            beforeEach(() => {
                mockTree = jasmine.createSpyObj<IgxTreeComponent>('mockTree', ['findNodes'],
                {
                    nodeCollapsing: jasmine.createSpyObj('spy', ['emit']),
                    nodeExpanding: jasmine.createSpyObj('spy', ['emit']),
                    nodeCollapsed: jasmine.createSpyObj('spy', ['emit']),
                    nodeExpanded: jasmine.createSpyObj('spy', ['emit']),
                });
                mockCdr = jasmine.createSpyObj<ChangeDetectorRef>('mockCdr', ['detectChanges', 'markForCheck'], {});
                mockBuilder = jasmine.createSpyObj<AnimationBuilder>('mockAB', ['build'], {});
            });
            it('Should call service expand/collapse methods when toggling state through `[expanded]` input', () => {
                const node = new IgxTreeNodeComponent<any>(mockTree, mockSelectionService, mockTreeService,
                mockNavService, mockCdr, mockBuilder, mockElementRef, null);
                expect(mockTreeService.collapse).not.toHaveBeenCalled();
                expect(mockTreeService.expand).not.toHaveBeenCalled();
                expect(mockTree.nodeExpanded.emit).not.toHaveBeenCalled();
                expect(mockTree.nodeCollapsed.emit).not.toHaveBeenCalled();
                expect(mockTree.nodeExpanding.emit).not.toHaveBeenCalled();
                expect(mockTree.nodeExpanded.emit).not.toHaveBeenCalled();
                node.expanded = true;
                expect(mockTreeService.expand).toHaveBeenCalledTimes(1);
                expect(mockTreeService.expand).toHaveBeenCalledWith(node, false);
                node.expanded = false;
                expect(mockTreeService.collapse).toHaveBeenCalledTimes(1);
                expect(mockTreeService.collapse).toHaveBeenCalledWith(node);
                // events are not emitted when chainging state through input
                expect(mockTree.nodeExpanded.emit).not.toHaveBeenCalled();
                expect(mockTree.nodeCollapsed.emit).not.toHaveBeenCalled();
                expect(mockTree.nodeExpanding.emit).not.toHaveBeenCalled();
                expect(mockTree.nodeExpanded.emit).not.toHaveBeenCalled();
            });
            it('Should call service expand/collapse methods when calling API state methods', () => {
                const node = new IgxTreeNodeComponent<any>(mockTree, mockSelectionService, mockTreeService,
                mockNavService, mockCdr, mockBuilder, mockElementRef, null);
                const emitSpy = spyOn(node, 'expandedChange');
                const openAnimationSpy = spyOn(node, 'playOpenAnimation');
                const closeAnimationSpy = spyOn(node, 'playCloseAnimation');
                const mockObj = jasmine.createSpyObj<any>('mockElement', ['focus']);
                const ingArgs = {
                    owner: mockTree,
                    cancel: false,
                    node
                };
                const edArgs = {
                    owner: mockTree,
                    node
                };
                (node as any).childrenContainer = mockObj;
                expect(mockTreeService.collapse).not.toHaveBeenCalled();
                expect(mockTreeService.expand).not.toHaveBeenCalled();
                expect(mockTreeService.collapsing).not.toHaveBeenCalled();
                expect(openAnimationSpy).not.toHaveBeenCalled();
                expect(closeAnimationSpy).not.toHaveBeenCalled();
                expect(mockCdr.markForCheck).not.toHaveBeenCalled();
                expect(mockTreeService.collapsing).not.toHaveBeenCalled();
                expect(mockTree.nodeExpanding.emit).not.toHaveBeenCalledWith();
                expect(mockTree.nodeCollapsing.emit).not.toHaveBeenCalledWith();
                expect(mockTree.nodeExpanded.emit).not.toHaveBeenCalledWith();
                expect(mockTree.nodeCollapsed.emit).not.toHaveBeenCalledWith();
                expect(emitSpy).not.toHaveBeenCalled();
                node.ngOnInit();
                node.expand();
                expect(openAnimationSpy).toHaveBeenCalledWith(mockObj);
                expect(openAnimationSpy).toHaveBeenCalledTimes(1);
                expect(mockTree.nodeExpanded.emit).toHaveBeenCalledTimes(0);
                expect(mockTree.nodeExpanding.emit).toHaveBeenCalledWith(ingArgs);
                expect(mockTreeService.expand).toHaveBeenCalledWith(node, true);
                expect(mockTreeService.expand).toHaveBeenCalledTimes(1);
                node.openAnimationDone.emit();
                expect(mockTree.nodeExpanded.emit).toHaveBeenCalledTimes(1);
                expect(mockTree.nodeExpanded.emit).toHaveBeenCalledWith(edArgs);
                node.collapse();
                expect(closeAnimationSpy).toHaveBeenCalledWith(mockObj);
                expect(closeAnimationSpy).toHaveBeenCalledTimes(1);
                expect(mockTree.nodeCollapsed.emit).toHaveBeenCalledTimes(0);
                expect(mockTree.nodeCollapsing.emit).toHaveBeenCalledWith(ingArgs);
                // collapse happens after animation finishes
                expect(mockTreeService.collapse).toHaveBeenCalledTimes(0);
                node.closeAnimationDone.emit();
                expect(mockTreeService.collapse).toHaveBeenCalledTimes(1);
                expect(mockTreeService.collapse).toHaveBeenCalledWith(node);
                expect(mockTree.nodeCollapsed.emit).toHaveBeenCalledTimes(1);
                expect(mockTree.nodeCollapsed.emit).toHaveBeenCalledWith(edArgs);
                spyOn(node, 'expand');
                spyOn(node, 'collapse');
                node.toggle();
                expect(node.expand).toHaveBeenCalledTimes(1);
                expect(node.collapse).toHaveBeenCalledTimes(0);
                spyOn(mockTreeService, 'isExpanded').and.returnValue(true);
                node.toggle();
                expect(node.expand).toHaveBeenCalledTimes(1);
                expect(node.collapse).toHaveBeenCalledTimes(1);
            });
            it('Should properly get tree display density token', () => {
                pending('Test not implemented');
            });
            it('Should have correct path to node, regardless if node has parent or not', () => {
                pending('Test not implemented');
            });
        });
        describe('IgxTreeService', () => {
            it('Should properly register tree', () => {
                const service = new IgxTreeService();
                expect((service as any).tree).toBe(undefined);
                const mockTree = jasmine.createSpyObj<any>('tree', ['findNodes']);
                service.register(mockTree);
                expect((service as any).tree).toBe(mockTree);
            });
            it('Should keep a proper collection of expanded and collapsing nodes at all time, firing `expandedChange` when needed', () => {
                const service = new IgxTreeService();
                const mockTree = jasmine.createSpyObj<any>('tree', ['findNodes'], {
                    _singleBranchExpand: false,
                    get singleBranchExpand(): boolean {
                        return this._singleBranchExpand;
                    },
                    set singleBranchExpand(val: boolean) {
                        this._singleBranchExpand = val;
                    }
                });
                service.register(mockTree);
                spyOn(service.expandedNodes, 'add').and.callThrough();
                spyOn(service.expandedNodes, 'delete').and.callThrough();
                spyOn(service.collapsingNodes, 'add').and.callThrough();
                spyOn(service.collapsingNodes, 'delete').and.callThrough();
                expect(service.expandedNodes.size).toBe(0);
                expect(service.collapsingNodes.size).toBe(0);
                const mockNode = jasmine.createSpyObj<any>('node', ['collapse'], {
                    expandedChange: jasmine.createSpyObj('emitter', ['emit'])
                });
                service.expand(mockNode);
                expect(service.collapsingNodes.delete).toHaveBeenCalledWith(mockNode);
                expect(service.collapsingNodes.delete).toHaveBeenCalledTimes(1);
                expect(service.expandedNodes.add).toHaveBeenCalledWith(mockNode);
                expect(mockNode.expandedChange.emit).toHaveBeenCalledTimes(1);
                expect(mockNode.expandedChange.emit).toHaveBeenCalledWith(true);
                expect(service.expandedNodes.size).toBe(1);
                expect(mockNode.collapse).not.toHaveBeenCalled();
                service.expand(mockNode);
                expect(service.collapsingNodes.delete).toHaveBeenCalledTimes(2);
                expect(mockNode.expandedChange.emit).toHaveBeenCalledTimes(1);
                expect(service.expandedNodes.size).toBe(1);
                service.collapse(mockNode);
                expect(mockNode.expandedChange.emit).toHaveBeenCalledTimes(2);
                expect(mockNode.expandedChange.emit).toHaveBeenCalledWith(false);
                expect(service.collapsingNodes.delete).toHaveBeenCalledWith(mockNode);
                expect(service.collapsingNodes.delete).toHaveBeenCalledTimes(3);
                expect(service.expandedNodes.delete).toHaveBeenCalledTimes(1);
                expect(service.expandedNodes.delete).toHaveBeenCalledWith(mockNode);
                expect(service.expandedNodes.size).toBe(0);
                service.collapse(mockNode);
                expect(mockNode.expandedChange.emit).toHaveBeenCalledTimes(2);
                expect(service.collapsingNodes.delete).toHaveBeenCalledTimes(4);
                expect(service.expandedNodes.delete).toHaveBeenCalledTimes(2);
                const mockArray = [];
                for (let i = 0; i < 5; i++) {
                    const node = jasmine.createSpyObj('node', ['collapse'], {
                        _expanded: false,
                        get expanded() {
                            return this._expanded;
                        },
                        set expanded(val: boolean) {
                            this._expanded = val;
                        }
                    });
                    node.spyProp = spyOnProperty(node, 'expanded', 'set').and.callThrough();
                    mockArray.push(node);
                }
                spyOn(mockTree, 'findNodes').and.returnValue(mockArray);
                spyOnProperty(mockTree, 'singleBranchExpand', 'get').and.returnValue(true);
                service.expand(mockNode);
                mockArray.forEach(n => {
                    expect((n as any).spyProp).toHaveBeenCalledWith(false);
                    expect(n.collapse).not.toHaveBeenCalled();
                });
                service.collapse(mockNode);
                service.expand(mockNode, true);
                mockArray.forEach(n => {
                    expect(n.collapse).toHaveBeenCalled();
                });
                expect(service.collapsingNodes.size).toBe(0);
                service.collapsing(mockNode);
                expect(service.collapsingNodes.size).toBe(1);
            });
        });
    });
    describe('Rendering Tests', () => {
        describe('General', () => {
            it('Should only render node children', () => {
                pending();
            });
            it('Should not render collapsed nodes', () => {
                pending('Test not implemented');
            });
            it('Should apply proper node classes depending on tree displayDenisty', () => {
                pending('Test not implemented');

            });
            it('Should properly initialize all subscriptions when rendered', () => {

            });
        });
        describe('ARIA', () => {
            it('Should render proper roles for tree and nodes', () => {
                pending('Test not implemented');

            });
            it('Should render proper label for expand/collapse indicator, depending on node state', () => {
                pending('Test not implemented');

            });
            it('Should render proper roles for nodes containing link children', () => {
                pending('Test not implemented');

            });
        });
    });
});
@Component({
    template: `
        <igx-tree>
            <igx-tree-node [(expanded)]="node.expanded" [data]="node" *ngFor="let node of treeData">
            {{ node.label }}
                <igx-tree-node [(expanded)]="child.expanded" [data]="child" *ngFor="let child of node.children">
                {{ child.label }}
                    <igx-tree-node [(expanded)]="leafChild.expanded" [data]="leafChild" *ngFor="let leafChild of child.children">
                        {{ leafChild.label }}
                    </igx-tree-node>
                </igx-tree-node>
            </igx-tree-node>
        </igx-tree>
    `
})
class IgxTreeSampleComponent {
    @ViewChild(IgxTreeComponent)
    public tree: IgxTreeComponent;

    public data = createHierarchicalData(5, 3);
}

class MockDataItem {
    public selected = false;
    public expanded = false;
    public children: MockDataItem[] = [];
    constructor(public id: string, public label: string) {
    }
}

const createHierarchicalData = (siblings: number, depth: number): MockDataItem[] => {
    let id = 0;
    const returnArr = [];
    for (let i = 0; i < siblings; i++) {
        const item = new MockDataItem(`${depth}-${id}`, `Label ${depth}-${id}`);
        id++;
        returnArr.push(item);
        if (depth > 0) {
            item.children = createHierarchicalData(siblings, depth - 1);
        }
    }
    return returnArr;
};
