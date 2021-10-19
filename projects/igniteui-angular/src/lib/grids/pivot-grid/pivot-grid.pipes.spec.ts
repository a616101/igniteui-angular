import { NoopPivotDimensionsStrategy } from '../../data-operations/pivot-strategy';
import { IgxNumberSummaryOperand } from '../summaries/grid-summary';
import { IPivotConfiguration, IPivotValue } from './pivot-grid.interface';
import { IgxPivotColumnPipe, IgxPivotRowExpansionPipe, IgxPivotRowPipe } from './pivot-grid.pipes';

describe('Pivot pipes', () => {
    // This pipe is a pure, stateless function so no need for BeforeEach
    const rowPipe = new IgxPivotRowPipe();
    const rowStatePipe = new IgxPivotRowExpansionPipe();
    const columnPipe = new IgxPivotColumnPipe();
    const expansionStates = new Map<any, boolean>();
    const data = [
        { ProductCategory: 'Clothing', UnitPrice: 12.81, SellerName: 'Stanley', Country: 'Bulgaria', Date: '01/01/2021', UnitsSold: 282 },
        { ProductCategory: 'Clothing', UnitPrice: 49.57, SellerName: 'Elisa', Country: 'USA', Date: '01/05/2019', UnitsSold: 296 },
        { ProductCategory: 'Bikes', UnitPrice: 3.56, SellerName: 'Lydia', Country: 'Uruguay', Date: '01/06/2020', UnitsSold: 68 },
        { ProductCategory: 'Accessories', UnitPrice: 85.58, SellerName: 'David', Country: 'USA', Date: '04/07/2021', UnitsSold: 293 },
        { ProductCategory: 'Components', UnitPrice: 18.13, SellerName: 'John', Country: 'USA', Date: '12/08/2021', UnitsSold: 240 },
        { ProductCategory: 'Clothing', UnitPrice: 68.33, SellerName: 'Larry', Country: 'Uruguay', Date: '05/12/2020', UnitsSold: 456 },
        { ProductCategory: 'Clothing', UnitPrice: 16.05, SellerName: 'Walter', Country: 'Bulgaria', Date: '02/19/2020', UnitsSold: 492 }
    ];

    const pivotConfigHierarchy: IPivotConfiguration = {
        columns: [{
            member: () => 'All',
            enabled: true,
            childLevels: [{
                member: 'Country',
                enabled: true,
                childLevels: []
            }]
        }],
        rows: [{
            member: () => 'All',
            enabled: true,
            childLevels: [
                {
                    member: (d) => d.ProductCategory,
                    enabled: true,
                    childLevels: []
                }
            ]
        }],
        values: [
            {
                member: 'UnitsSold',
                aggregate: IgxNumberSummaryOperand.sum,
                enabled: true
            }
        ],
        filters: null
    };

    it('transforms flat data to pivot data', () => {
        const rowPipeResult = rowPipe.transform(data, pivotConfigHierarchy, expansionStates);
        const rowStatePipeResult = rowStatePipe.transform(rowPipeResult, pivotConfigHierarchy, expansionStates);
        const columnPipeResult = columnPipe.transform(rowStatePipeResult, pivotConfigHierarchy, expansionStates);
        expect(columnPipeResult).toEqual([
            {
                field1: 'All', All: 2127, 'All-Bulgaria': 774, 'All-USA': 829, 'All-Uruguay': 524, level: 0, field1_level: 0, records: [
                    { field1: 'Clothing', All: 1526, 'All-Bulgaria': 774,'All-USA': 296,'All-Uruguay': 456, level: 1, field1_level: 1 },
                    { field1: 'Bikes', All: 68, 'All-Uruguay': 68, level: 1, field1_level: 1  },
                    { field1: 'Accessories', All: 293, 'All-USA': 293, level: 1, field1_level: 1  },
                    { field1: 'Components', All: 240, 'All-USA': 240, level: 1, field1_level: 1  }
                ]
            },
            { field1: 'Clothing', All: 1526, 'All-Bulgaria': 774,'All-USA': 296,'All-Uruguay': 456, level: 1, field1_level: 1  },
            { field1: 'Bikes', All: 68, 'All-Uruguay': 68, level: 1, field1_level: 1 },
            { field1: 'Accessories', All: 293, 'All-USA': 293, level: 1, field1_level: 1 },
            { field1: 'Components', All: 240, 'All-USA': 240, level: 1, field1_level: 1 }
        ]);
    });

    it('transforms flat data to pivot data single row dimension and no children are defined', () => {
        const config = Object.assign({}, pivotConfigHierarchy);
        config.rows = [{
            member: 'ProductCategory',
            enabled: true,
            childLevels: []
        }];
        const rowPipeResult = rowPipe.transform(data, config , expansionStates);
        expect(rowPipeResult).toEqual([
            {
                ProductCategory: 'Clothing', level: 0,  ProductCategory_level: 0, records: [
        { ProductCategory: 'Clothing', UnitPrice: 12.81, SellerName: 'Stanley', Country: 'Bulgaria', Date: '01/01/2021', UnitsSold: 282 },
        { ProductCategory: 'Clothing', UnitPrice: 49.57, SellerName: 'Elisa', Country: 'USA', Date: '01/05/2019', UnitsSold: 296 },
        { ProductCategory: 'Clothing', UnitPrice: 68.33, SellerName: 'Larry', Country: 'Uruguay', Date: '05/12/2020', UnitsSold: 456 },
        { ProductCategory: 'Clothing', UnitPrice: 16.05, SellerName: 'Walter', Country: 'Bulgaria', Date: '02/19/2020', UnitsSold: 492 }]
            },
            {
                ProductCategory: 'Bikes', level: 0,  ProductCategory_level: 0, records: [
        { ProductCategory: 'Bikes', UnitPrice: 3.56, SellerName: 'Lydia', Country: 'Uruguay', Date: '01/06/2020', UnitsSold: 68 }
                ]
            },
            {
                ProductCategory: 'Accessories', level: 0,  ProductCategory_level: 0, records: [
        { ProductCategory: 'Accessories', UnitPrice: 85.58, SellerName: 'David', Country: 'USA', Date: '04/07/2021', UnitsSold: 293 }
                ]
            },
            {
                ProductCategory: 'Components', level: 0,  ProductCategory_level: 0, records: [
        { ProductCategory: 'Components', UnitPrice: 18.13, SellerName: 'John', Country: 'USA', Date: '12/08/2021', UnitsSold: 240 }
                ]
            }
        ]);
        const columnPipeResult = columnPipe.transform(rowPipeResult, config, expansionStates);
        expect(columnPipeResult).toEqual([
            { ProductCategory: 'Clothing', All: 1526, 'All-Bulgaria': 774, 'All-USA': 296,
             'All-Uruguay': 456, level: 0, ProductCategory_level: 0 },
            { ProductCategory: 'Bikes', All: 68, 'All-Uruguay': 68, level: 0,  ProductCategory_level: 0 },
            { ProductCategory: 'Accessories', All: 293, 'All-USA': 293, level: 0,  ProductCategory_level: 0 },
            { ProductCategory: 'Components', All: 240, 'All-USA': 240, level: 0,  ProductCategory_level: 0 }
        ]);
    });

    it('allows setting expand/collapse state.', () => {
        const expanded =  new Map<any, boolean>();
        expanded.set('All', false);
        const rowPipeResult = rowPipe.transform(data, pivotConfigHierarchy, expanded);
        const rowPipeCollapseResult = rowStatePipe.transform(rowPipeResult, pivotConfigHierarchy, expanded);
       expect(rowPipeCollapseResult).toEqual([
           { field1:'All',records: [
               {
                    field1:'All-Clothing',
                    records:[
                    {ProductCategory:'Clothing', UnitPrice:12.81, SellerName:'Stanley',
                     Country:'Bulgaria', Date:'01/01/2021', UnitsSold:282},
                    {ProductCategory:'Clothing', UnitPrice:49.57, SellerName:'Elisa', Country:'USA', Date:'01/05/2019', UnitsSold:296},
                    {ProductCategory:'Clothing', UnitPrice:68.33, SellerName:'Larry', Country:'Uruguay', Date:'05/12/2020', UnitsSold:456},
                    {ProductCategory:'Clothing', UnitPrice:16.05, SellerName:'Walter', Country:'Bulgaria', Date:'02/19/2020', UnitsSold:492}
                    ]
                    ,level:1, field1_level: 1
                },
                {
                    field1:'All-Bikes',
                    records:[
                        {ProductCategory:'Bikes',UnitPrice:3.56,SellerName:'Lydia',Country:'Uruguay',Date:'01/06/2020',UnitsSold:68}
                    ]
                    ,level:1, field1_level: 1
                },
                {
                    field1:'All-Accessories',
                    records:[
                        {ProductCategory:'Accessories',UnitPrice:85.58,SellerName:'David',Country:'USA',Date:'04/07/2021',UnitsSold:293}
                    ]
                    ,level:1, field1_level: 1},
                {
                field1:'All-Components',
                records:[
                    {ProductCategory:'Components',UnitPrice:18.13,SellerName:'John',Country:'USA',Date:'12/08/2021',UnitsSold:240}
                ]
                ,level:1, field1_level: 1}
            ]
            ,level:0, field1_level: 0}
        ]);

        expanded.set('All', true);
        const rowPipeExpandResult = rowStatePipe.transform(rowPipeResult, pivotConfigHierarchy, expanded);
        expect(rowPipeExpandResult).toEqual([
            { field1:'All',records: [
                {
                     field1:'All-Clothing',
                     records:[
                     {ProductCategory:'Clothing',UnitPrice:12.81,SellerName:'Stanley',Country:'Bulgaria',Date:'01/01/2021',UnitsSold:282},
                     {ProductCategory:'Clothing',UnitPrice:49.57,SellerName:'Elisa',Country:'USA',Date:'01/05/2019',UnitsSold:296},
                     {ProductCategory:'Clothing',UnitPrice:68.33,SellerName:'Larry',Country:'Uruguay',Date:'05/12/2020',UnitsSold:456},
                     {ProductCategory:'Clothing',UnitPrice:16.05,SellerName:'Walter',Country:'Bulgaria',Date:'02/19/2020',UnitsSold:492}
                     ]
                     ,level:1, field1_level: 1
                 },
                 {
                     field1:'All-Bikes',
                     records:[
                         {ProductCategory:'Bikes',UnitPrice:3.56,SellerName:'Lydia',Country:'Uruguay',Date:'01/06/2020',UnitsSold:68}
                     ]
                     ,level:1, field1_level: 1
                 },
                 {
                     field1:'All-Accessories',
                     records:[
                         {ProductCategory:'Accessories',UnitPrice:85.58,SellerName:'David',Country:'USA',Date:'04/07/2021',UnitsSold:293}
                     ]
                     ,level:1, field1_level: 1},
                 {
                 field1:'All-Components',
                 records:[
                     {ProductCategory:'Components',UnitPrice:18.13,SellerName:'John',Country:'USA',Date:'12/08/2021',UnitsSold:240}
                 ]
                 ,level:1, field1_level: 1}
             ]
             ,level:0, field1_level: 0},
             {
                field1:'All-Clothing',
                records:[
                {ProductCategory:'Clothing',UnitPrice:12.81,SellerName:'Stanley',Country:'Bulgaria',Date:'01/01/2021',UnitsSold:282},
                {ProductCategory:'Clothing',UnitPrice:49.57,SellerName:'Elisa',Country:'USA',Date:'01/05/2019',UnitsSold:296},
                {ProductCategory:'Clothing',UnitPrice:68.33,SellerName:'Larry',Country:'Uruguay',Date:'05/12/2020',UnitsSold:456},
                {ProductCategory:'Clothing',UnitPrice:16.05,SellerName:'Walter',Country:'Bulgaria',Date:'02/19/2020',UnitsSold:492}
                ]
                ,level:1, field1_level: 1
            },
            {
                field1:'All-Bikes',
                records:[
                    {ProductCategory:'Bikes',UnitPrice:3.56,SellerName:'Lydia',Country:'Uruguay',Date:'01/06/2020',UnitsSold:68}
                ]
                ,level:1, field1_level: 1
            },
            {
                field1:'All-Accessories',
                records:[
                    {ProductCategory:'Accessories',UnitPrice:85.58,SellerName:'David',Country:'USA',Date:'04/07/2021',UnitsSold:293}
                ]
                ,level:1, field1_level: 1},
            {
            field1:'All-Components',
            records:[
                {ProductCategory:'Components',UnitPrice:18.13,SellerName:'John',Country:'USA',Date:'12/08/2021',UnitsSold:240}
            ]
            ,level:1, field1_level: 1}
         ]);
    });

    it('transforms flat data to pivot data multiple row dimensions', () => {
        const rowPipeResult = rowPipe.transform(data, [{
            member: 'ProductCategory',
            enabled: true,
            childLevels: []
        },
        {
            member: 'Date',
            enabled: true,
            childLevels: []
        }];
        const rowPipeResult = rowPipe.transform(data, config, expansionStates);

        expect(rowPipeResult).toEqual([
            {
                Date: '01/01/2021',
                records: [
                    {
                        ProductCategory: 'Clothing',
                        UnitPrice: 12.81,
                        SellerName: 'Stanley',
                        Country: 'Bulgaria',
                        Date: '01/01/2021',
                        UnitsSold: 282
                    }
                ],
                level: 0,
                ProductCategory: 'Clothing',
                Date_level: 0,
                ProductCategory_level: 0
            },
            {
                Date: '01/05/2019',
                records: [
                    {
                        ProductCategory: 'Clothing',
                        UnitPrice: 49.57,
                        SellerName: 'Elisa',
                        Country: 'USA',
                        Date: '01/05/2019',
                        UnitsSold: 296
                    }
                ],
                level: 0,
                ProductCategory: 'Clothing',
                Date_level: 0,
                ProductCategory_level: 0
            },
            {
                Date: '05/12/2020',
                records: [
                    {
                        ProductCategory: 'Clothing',
                        UnitPrice: 68.33,
                        SellerName: 'Larry',
                        Country: 'Uruguay',
                        Date: '05/12/2020',
                        UnitsSold: 456
                    }
                ],
                level: 0,
                ProductCategory: 'Clothing',
                Date_level: 0,
                ProductCategory_level: 0
            },
            {
                Date: '02/19/2020',
                records: [
                    {
                        ProductCategory: 'Clothing',
                        UnitPrice: 16.05,
                        SellerName: 'Walter',
                        Country: 'Bulgaria',
                        Date: '02/19/2020',
                        UnitsSold: 492
                    }
                ],
                level: 0,
                ProductCategory: 'Clothing',
                Date_level: 0,
                ProductCategory_level: 0
            },
            {
                Date: '01/06/2020',
                records: [
                    {
                        ProductCategory: 'Bikes',
                        UnitPrice: 3.56,
                        SellerName: 'Lydia',
                        Country: 'Uruguay',
                        Date: '01/06/2020',
                        UnitsSold: 68
                    }
                ],
                level: 0,
                ProductCategory: 'Bikes',
                Date_level: 0,
                ProductCategory_level: 0
            },
            {
                Date: '04/07/2021',
                records: [
                    {
                        ProductCategory: 'Accessories',
                        UnitPrice: 85.58,
                        SellerName: 'David',
                        Country: 'USA',
                        Date: '04/07/2021',
                        UnitsSold: 293
                    }
                ],
                level: 0,
                ProductCategory: 'Accessories',
                Date_level: 0,
                ProductCategory_level: 0
            },
            {
                Date: '12/08/2021',
                records: [
                    {
                        ProductCategory: 'Components',
                        UnitPrice: 18.13,
                        SellerName: 'John',
                        Country: 'USA',
                        Date: '12/08/2021',
                        UnitsSold: 240
                    }
                ],
                level: 0,
                ProductCategory: 'Components',
                Date_level: 0,
                ProductCategory_level: 0
            }
        ]);
    });

    it('transforms flat data to pivot data with multiple nested row dimensions', () => {
        const rowPipeResult = rowPipe.transform(data, [{
            member: () => 'AllProd',
            enabled: true,
            childLevels: [{
            member: 'ProductCategory',
            enabled: true,
            childLevels: []
            }]
        },
        {
            member: () => 'AllDate',
            enabled: true,
            childLevels: [{
            member: 'Date',
            enabled: true,
            childLevels: []
            }]
        }], expansionStates, pivotConfigHierarchy.values);
        const columnPipeResult = columnPipe.transform(rowPipeResult, pivotConfigHierarchy.columns, pivotConfigHierarchy.values);
        expect(columnPipeResult).toEqual([{
            field2: 'AllDate',
            records: [{
                Date: '01/01/2021',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 12.81,
                    SellerName: 'Stanley',
                    Country: 'Bulgaria',
                    Date: '01/01/2021',
                    UnitsSold: 282
                }, {
                    ProductCategory: 'Clothing',
                    records: [{
                        ProductCategory: 'Clothing',
                        UnitPrice: 12.81,
                        SellerName: 'Stanley',
                        Country: 'Bulgaria',
                        Date: '01/01/2021',
                        UnitsSold: 282
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 564,
                'All-Bulgaria': 564
            }, {
                Date: '01/05/2019',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 49.57,
                    SellerName: 'Elisa',
                    Country: 'USA',
                    Date: '01/05/2019',
                    UnitsSold: 296
                }, {
                    ProductCategory: 'Clothing',
                    records: [{
                        ProductCategory: 'Clothing',
                        UnitPrice: 49.57,
                        SellerName: 'Elisa',
                        Country: 'USA',
                        Date: '01/05/2019',
                        UnitsSold: 296
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 592,
                'All-USA': 592
            }, {
                Date: '05/12/2020',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 68.33,
                    SellerName: 'Larry',
                    Country: 'Uruguay',
                    Date: '05/12/2020',
                    UnitsSold: 456
                }, {
                    ProductCategory: 'Clothing',
                    records: [{
                        ProductCategory: 'Clothing',
                        UnitPrice: 68.33,
                        SellerName: 'Larry',
                        Country: 'Uruguay',
                        Date: '05/12/2020',
                        UnitsSold: 456
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 912,
                'All-Uruguay': 912
            }, {
                Date: '02/19/2020',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 16.05,
                    SellerName: 'Walter',
                    Country: 'Bulgaria',
                    Date: '02/19/2020',
                    UnitsSold: 492
                }, {
                    ProductCategory: 'Clothing',
                    records: [{
                        ProductCategory: 'Clothing',
                        UnitPrice: 16.05,
                        SellerName: 'Walter',
                        Country: 'Bulgaria',
                        Date: '02/19/2020',
                        UnitsSold: 492
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 984,
                'All-Bulgaria': 984
            }, {
                Date: '01/06/2020',
                records: [{
                    ProductCategory: 'Bikes',
                    UnitPrice: 3.56,
                    SellerName: 'Lydia',
                    Country: 'Uruguay',
                    Date: '01/06/2020',
                    UnitsSold: 68
                }, {
                    ProductCategory: 'Bikes',
                    records: [{
                        ProductCategory: 'Bikes',
                        UnitPrice: 3.56,
                        SellerName: 'Lydia',
                        Country: 'Uruguay',
                        Date: '01/06/2020',
                        UnitsSold: 68
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 136,
                'All-Uruguay': 136
            }, {
                Date: '04/07/2021',
                records: [{
                    ProductCategory: 'Accessories',
                    UnitPrice: 85.58,
                    SellerName: 'David',
                    Country: 'USA',
                    Date: '04/07/2021',
                    UnitsSold: 293
                }, {
                    ProductCategory: 'Accessories',
                    records: [{
                        ProductCategory: 'Accessories',
                        UnitPrice: 85.58,
                        SellerName: 'David',
                        Country: 'USA',
                        Date: '04/07/2021',
                        UnitsSold: 293
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 586,
                'All-USA': 586
            }, {
                Date: '12/08/2021',
                records: [{
                    ProductCategory: 'Components',
                    UnitPrice: 18.13,
                    SellerName: 'John',
                    Country: 'USA',
                    Date: '12/08/2021',
                    UnitsSold: 240
                }, {
                    ProductCategory: 'Components',
                    records: [{
                        ProductCategory: 'Components',
                        UnitPrice: 18.13,
                        SellerName: 'John',
                        Country: 'USA',
                        Date: '12/08/2021',
                        UnitsSold: 240
                    }],
                    level: 1,
                    ProductCategory_level: 1
                }],
                level: 1,
                Date_level: 1,
                field1: 'AllProd',
                field1_level: 0,
                All: 480,
                'All-USA': 480
            }],
            level: 0,
            field2_level: 0,
            field1: 'AllProd',
            field1_level: 0,
            All: 4254,
            'All-Bulgaria': 1548,
            'All-USA': 1658,
            'All-Uruguay': 1048
        }, {
            Date: '01/01/2021',
            records: [{
                ProductCategory: 'Clothing',
                UnitPrice: 12.81,
                SellerName: 'Stanley',
                Country: 'Bulgaria',
                Date: '01/01/2021',
                UnitsSold: 282
            }, {
                ProductCategory: 'Clothing',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 12.81,
                    SellerName: 'Stanley',
                    Country: 'Bulgaria',
                    Date: '01/01/2021',
                    UnitsSold: 282
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 564,
            'All-Bulgaria': 564
        }, {
            Date: '01/05/2019',
            records: [{
                ProductCategory: 'Clothing',
                UnitPrice: 49.57,
                SellerName: 'Elisa',
                Country: 'USA',
                Date: '01/05/2019',
                UnitsSold: 296
            }, {
                ProductCategory: 'Clothing',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 49.57,
                    SellerName: 'Elisa',
                    Country: 'USA',
                    Date: '01/05/2019',
                    UnitsSold: 296
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 592,
            'All-USA': 592
        }, {
            Date: '05/12/2020',
            records: [{
                ProductCategory: 'Clothing',
                UnitPrice: 68.33,
                SellerName: 'Larry',
                Country: 'Uruguay',
                Date: '05/12/2020',
                UnitsSold: 456
            }, {
                ProductCategory: 'Clothing',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 68.33,
                    SellerName: 'Larry',
                    Country: 'Uruguay',
                    Date: '05/12/2020',
                    UnitsSold: 456
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 912,
            'All-Uruguay': 912
        }, {
            Date: '02/19/2020',
            records: [{
                ProductCategory: 'Clothing',
                UnitPrice: 16.05,
                SellerName: 'Walter',
                Country: 'Bulgaria',
                Date: '02/19/2020',
                UnitsSold: 492
            }, {
                ProductCategory: 'Clothing',
                records: [{
                    ProductCategory: 'Clothing',
                    UnitPrice: 16.05,
                    SellerName: 'Walter',
                    Country: 'Bulgaria',
                    Date: '02/19/2020',
                    UnitsSold: 492
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 984,
            'All-Bulgaria': 984
        }, {
            Date: '01/06/2020',
            records: [{
                ProductCategory: 'Bikes',
                UnitPrice: 3.56,
                SellerName: 'Lydia',
                Country: 'Uruguay',
                Date: '01/06/2020',
                UnitsSold: 68
            }, {
                ProductCategory: 'Bikes',
                records: [{
                    ProductCategory: 'Bikes',
                    UnitPrice: 3.56,
                    SellerName: 'Lydia',
                    Country: 'Uruguay',
                    Date: '01/06/2020',
                    UnitsSold: 68
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 136,
            'All-Uruguay': 136
        }, {
            Date: '04/07/2021',
            records: [{
                ProductCategory: 'Accessories',
                UnitPrice: 85.58,
                SellerName: 'David',
                Country: 'USA',
                Date: '04/07/2021',
                UnitsSold: 293
            }, {
                ProductCategory: 'Accessories',
                records: [{
                    ProductCategory: 'Accessories',
                    UnitPrice: 85.58,
                    SellerName: 'David',
                    Country: 'USA',
                    Date: '04/07/2021',
                    UnitsSold: 293
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 586,
            'All-USA': 586
        }, {
            Date: '12/08/2021',
            records: [{
                ProductCategory: 'Components',
                UnitPrice: 18.13,
                SellerName: 'John',
                Country: 'USA',
                Date: '12/08/2021',
                UnitsSold: 240
            }, {
                ProductCategory: 'Components',
                records: [{
                    ProductCategory: 'Components',
                    UnitPrice: 18.13,
                    SellerName: 'John',
                    Country: 'USA',
                    Date: '12/08/2021',
                    UnitsSold: 240
                }],
                level: 1,
                ProductCategory_level: 1
            }],
            level: 1,
            Date_level: 1,
            field1: 'AllProd',
            field1_level: 0,
            All: 480,
            'All-USA': 480
        }, {
            field2: 'AllDate',
            records: [{
                Date: '01/01/2021',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Clothing',
                ProductCategory_level: 1,
                All: 282,
                'All-Bulgaria': 282
            }, {
                Date: '01/05/2019',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Clothing',
                ProductCategory_level: 1,
                All: 296,
                'All-USA': 296
            }, {
                Date: '05/12/2020',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Clothing',
                ProductCategory_level: 1,
                All: 456,
                'All-Uruguay': 456
            }, {
                Date: '02/19/2020',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Clothing',
                ProductCategory_level: 1,
                All: 492,
                'All-Bulgaria': 492
            }],
            level: 0,
            field2_level: 0,
            ProductCategory: 'Clothing',
            ProductCategory_level: 1,
            All: 1526,
            'All-Bulgaria': 774,
            'All-USA': 296,
            'All-Uruguay': 456
        }, {
            Date: '01/01/2021',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Clothing',
            ProductCategory_level: 1,
            All: 282,
            'All-Bulgaria': 282
        }, {
            Date: '01/05/2019',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Clothing',
            ProductCategory_level: 1,
            All: 296,
            'All-USA': 296
        }, {
            Date: '05/12/2020',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Clothing',
            ProductCategory_level: 1,
            All: 456,
            'All-Uruguay': 456
        }, {
            Date: '02/19/2020',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Clothing',
            ProductCategory_level: 1,
            All: 492,
            'All-Bulgaria': 492
        }, {
            field2: 'AllDate',
            records: [{
                Date: '01/06/2020',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Bikes',
                ProductCategory_level: 1,
                All: 68,
                'All-Uruguay': 68
            }],
            level: 0,
            field2_level: 0,
            ProductCategory: 'Bikes',
            ProductCategory_level: 1,
            All: 68,
            'All-Uruguay': 68
        }, {
            Date: '01/06/2020',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Bikes',
            ProductCategory_level: 1,
            All: 68,
            'All-Uruguay': 68
        }, {
            field2: 'AllDate',
            records: [{
                Date: '04/07/2021',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Accessories',
                ProductCategory_level: 1,
                All: 293,
                'All-USA': 293
            }],
            level: 0,
            field2_level: 0,
            ProductCategory: 'Accessories',
            ProductCategory_level: 1,
            All: 293,
            'All-USA': 293
        }, {
            Date: '04/07/2021',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Accessories',
            ProductCategory_level: 1,
            All: 293,
            'All-USA': 293
        }, {
            field2: 'AllDate',
            records: [{
                Date: '12/08/2021',
                level: 1,
                Date_level: 1,
                ProductCategory: 'Components',
                ProductCategory_level: 1,
                All: 240,
                'All-USA': 240
            }],
            level: 0,
            field2_level: 0,
            ProductCategory: 'Components',
            ProductCategory_level: 1,
            All: 240,
            'All-USA': 240
        }, {
            Date: '12/08/2021',
            level: 1,
            Date_level: 1,
            ProductCategory: 'Components',
            ProductCategory_level: 1,
            All: 240,
            'All-USA': 240
        }]);
    });

    it('transforms flat data to pivot data 2 column dimensions', () => {
        const config = Object.assign({}, pivotConfigHierarchy);
        config.columns = [{
            member: 'Country',
            enabled: true,
            childLevels:[]
            },
            {
            member: 'Date',
            enabled: true,
            childLevels: []
            }];
        const rowPipeResult = rowPipe.transform(data, config, new Map<any, boolean>());
        const rowStatePipeResult = rowStatePipe.transform(rowPipeResult, pivotConfigHierarchy,  new Map<any, boolean>());
        const columnPipeResult = columnPipe.transform(rowStatePipeResult, config, new Map<any, boolean>());
        /* eslint-disable quote-props */
        expect(columnPipeResult).toEqual([
            {'field1':'All','records':[
                {'field1':'Clothing','level':1, 'field1_level': 1, 'Bulgaria':774,'Bulgaria-01/01/2021':282,
                'Bulgaria-02/19/2020':492,'USA':296,'USA-01/05/2019':296,'Uruguay':456,'Uruguay-05/12/2020':456},
                {'field1':'Bikes','level':1, 'field1_level': 1,'Uruguay':68,'Uruguay-01/06/2020':68},
                {'field1':'Accessories','level':1, 'field1_level': 1, 'USA':293,'USA-04/07/2021':293},
                {'field1':'Components','level':1, 'field1_level': 1,'USA':240,'USA-12/08/2021':240}]
                ,'level':0, 'field1_level': 0,'Bulgaria':774,'Bulgaria-01/01/2021':282,'Bulgaria-02/19/2020':492,
                'USA':829,'USA-01/05/2019':296,'USA-04/07/2021':293,'USA-12/08/2021':240,
                'Uruguay':524,'Uruguay-05/12/2020':456,'Uruguay-01/06/2020':68},
            {'field1':'Clothing','level':1, 'field1_level': 1,'Bulgaria':774,'Bulgaria-01/01/2021':282,
            'Bulgaria-02/19/2020':492,'USA':296,'USA-01/05/2019':296,'Uruguay':456,'Uruguay-05/12/2020':456},
            {'field1':'Bikes','level':1, 'field1_level': 1,'Uruguay':68,'Uruguay-01/06/2020':68},
            {'field1':'Accessories','level':1, 'field1_level': 1,'USA':293,'USA-04/07/2021':293},
            {'field1':'Components','level':1, 'field1_level': 1,'USA':240,'USA-12/08/2021':240}]);
    });

    it('transforms flat data to pivot data 3 column dimensions', () => {
        const config = Object.assign({}, pivotConfigHierarchy);
        config.columns = [{
            member: 'Country',
            enabled: true,
            childLevels:[]
            },
            {
            member: 'SellerName',
            enabled: true,
            childLevels:[]
            },
            {
            member: 'Date',
            enabled: true,
            childLevels: []
            }];
        const rowPipeResult = rowPipe.transform(data, config, new Map<any, boolean>());
        const rowStateResult = rowStatePipe.transform(rowPipeResult, config, new Map<any, boolean>());
        const columnPipeResult = columnPipe.transform(rowStateResult, config, new Map<any, boolean>());
        /* eslint-disable quote-props */
        expect(columnPipeResult).toEqual([
            {'field1':'All','records':
            [
                {'field1':'Clothing','level':1, 'field1_level': 1, 'Bulgaria':774,'Bulgaria-Stanley':282,'Bulgaria-Stanley-01/01/2021':282,
                'Bulgaria-Walter':492,'Bulgaria-Walter-02/19/2020':492,'USA':296,'USA-Elisa':296,'USA-Elisa-01/05/2019':296,
                'Uruguay':456,'Uruguay-Larry':456,'Uruguay-Larry-05/12/2020':456},
                {'field1':'Bikes','level':1, 'field1_level': 1, 'Uruguay':68,'Uruguay-Lydia':68,'Uruguay-Lydia-01/06/2020':68},
                {'field1':'Accessories','level':1,'field1_level': 1, 'USA':293,'USA-David':293,'USA-David-04/07/2021':293},
                {'field1':'Components','level':1,'field1_level': 1, 'USA':240,'USA-John':240,'USA-John-12/08/2021':240}
            ],
            'level':0, 'field1_level': 0, 'Bulgaria':774,'Bulgaria-Stanley':282,'Bulgaria-Stanley-01/01/2021':282,'Bulgaria-Walter':492,
            'Bulgaria-Walter-02/19/2020':492,'USA':829,'USA-Elisa':296,'USA-Elisa-01/05/2019':296,'USA-David':293,
            'USA-David-04/07/2021':293,'USA-John':240,'USA-John-12/08/2021':240,'Uruguay':524,'Uruguay-Larry':456,
            'Uruguay-Larry-05/12/2020':456,'Uruguay-Lydia':68,'Uruguay-Lydia-01/06/2020':68},
            {'field1':'Clothing','level':1, 'field1_level': 1, 'Bulgaria':774,'Bulgaria-Stanley':282,'Bulgaria-Stanley-01/01/2021':282,
            'Bulgaria-Walter':492,'Bulgaria-Walter-02/19/2020':492,'USA':296,'USA-Elisa':296,'USA-Elisa-01/05/2019':296,'Uruguay':456,
            'Uruguay-Larry':456,'Uruguay-Larry-05/12/2020':456},
            {'field1':'Bikes','level':1,  'field1_level': 1, 'Uruguay':68,'Uruguay-Lydia':68,'Uruguay-Lydia-01/06/2020':68},
            {'field1':'Accessories','level':1, 'field1_level': 1, 'USA':293,'USA-David':293,'USA-David-04/07/2021':293},
            {'field1':'Components','level':1, 'field1_level': 1, 'USA':240,'USA-John':240,'USA-John-12/08/2021':240}
        ]);
    });

    it('transforms flat data to pivot data 2 value dimensions', () => {
        const values: IPivotValue[] = [
            {
                member: 'UnitsSold',
                aggregate: IgxNumberSummaryOperand.sum,
                enabled: true
            },
            {
                member: 'UnitPrice',
                aggregate: IgxNumberSummaryOperand.sum,
                enabled: true
            }
        ];
        const rowPipeResult = rowPipe.transform(data, pivotConfigHierarchy.rows, expansionStates, values);
        const columnPipeResult = columnPipe.transform(rowPipeResult, pivotConfigHierarchy.columns, values);
        expect(columnPipeResult).toEqual([{
            'field1':'All','records':[
            {'field1':'Clothing','level':1, 'field1_level': 1,'All-UnitsSold':1526,'All-Bulgaria-UnitsSold':774,
            'All-Bulgaria-UnitPrice':28.86,'All-USA-UnitsSold':296,'All-USA-UnitPrice':49.57,'All-Uruguay-UnitsSold':456,
            'All-Uruguay-UnitPrice':68.33,'All-UnitPrice':146.76},
            {'field1':'Bikes','level':1, 'field1_level': 1,'All-UnitsSold':68,'All-Uruguay-UnitsSold':68,
            'All-Uruguay-UnitPrice':3.56,'All-UnitPrice':3.56},
            {'field1':'Accessories','level':1, 'field1_level': 1,'All-UnitsSold':293,'All-USA-UnitsSold':293,
            'All-USA-UnitPrice':85.58,'All-UnitPrice':85.58},
            {'field1':'Components','level':1, 'field1_level': 1,'All-UnitsSold':240,'All-USA-UnitsSold':240,
            'All-USA-UnitPrice':18.13,'All-UnitPrice':18.13}
            ],'level':0, 'field1_level': 0,
            'All-UnitsSold':2127,'All-Bulgaria-UnitsSold':774,'All-Bulgaria-UnitPrice':28.86,'All-USA-UnitsSold':829,
            'All-USA-UnitPrice':153.28,'All-Uruguay-UnitsSold':524,'All-Uruguay-UnitPrice':71.89,'All-UnitPrice':254.02999999999997},
            {'field1':'Clothing','level':1, 'field1_level': 1,'All-UnitsSold':1526,'All-Bulgaria-UnitsSold':774,
            'All-Bulgaria-UnitPrice':28.86,'All-USA-UnitsSold':296,'All-USA-UnitPrice':49.57,'All-Uruguay-UnitsSold':456,
            'All-Uruguay-UnitPrice':68.33,'All-UnitPrice':146.76},
            {'field1':'Bikes','level':1,  'field1_level': 1,'All-UnitsSold':68,'All-Uruguay-UnitsSold':68,
            'All-Uruguay-UnitPrice':3.56,'All-UnitPrice':3.56},
            {'field1':'Accessories','level':1, 'field1_level': 1,'All-UnitsSold':293,'All-USA-UnitsSold':293,
            'All-USA-UnitPrice':85.58,'All-UnitPrice':85.58},
            {'field1':'Components','level':1, 'field1_level': 1,'All-UnitsSold':240,'All-USA-UnitsSold':240,
            'All-USA-UnitPrice':18.13,'All-UnitPrice':18.13}
            ]);
    });

    it('allow setting NoopPivotDimensionsStrategy for rows/columns', () => {
        const config = Object.assign({}, pivotConfigHierarchy);
        const preprocessedData = [
            {All:2127,records:[
                {ProductCategory:'Clothing', level:1, All:1526,'All-Bulgaria':774,'All-USA':296,'All-Uruguay':456},
                {ProductCategory:'Bikes', level:1, All:68,'All-Uruguay':68},
                {ProductCategory:'Accessories',level:1, All:293,'All-USA':293},
                {ProductCategory:'Components', level:1, All:240,'All-USA':240}]
                , level:0,'All-Bulgaria':774,'All-USA':829,'All-Uruguay':524}];
        config.columnStrategy =  NoopPivotDimensionsStrategy.instance();
        config.columns[0].fieldName = 'All';
        config.rowStrategy  = NoopPivotDimensionsStrategy.instance();
        config.rows[0].fieldName = 'All';

        const rowPipeResult = rowPipe.transform(preprocessedData, config, new Map<any, boolean>());
        const rowStateResult = rowStatePipe.transform(rowPipeResult, config, new Map<any, boolean>());
        const columnPipeResult = columnPipe.transform(rowStateResult, config, new Map<any, boolean>());

        // same data but expanded
        expect(columnPipeResult).toEqual([{All:2127,records:[
            {ProductCategory:'Clothing', level:1, All:1526,'All-Bulgaria':774,'All-USA':296,'All-Uruguay':456},
            {ProductCategory:'Bikes', level:1, All:68,'All-Uruguay':68},
            {ProductCategory:'Accessories',level:1, All:293,'All-USA':293},
            {ProductCategory:'Components', level:1, All:240,'All-USA':240}]
            , level:0,'All-Bulgaria':774,'All-USA':829,'All-Uruguay':524},
            {ProductCategory:'Clothing', level:1, All:1526,'All-Bulgaria':774,'All-USA':296,'All-Uruguay':456},
            {ProductCategory:'Bikes', level:1, All:68,'All-Uruguay':68},
            {ProductCategory:'Accessories',level:1, All:293,'All-USA':293},
            {ProductCategory:'Components', level:1, All:240,'All-USA':240}]);
    });
});
