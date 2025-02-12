import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { NgFor } from '@angular/common';
import { IgxAvatarComponent, IgxButtonDirective, IgxButtonGroupComponent, IgxGridComponent, IgxIconButtonDirective, IgxIconComponent, IgxListActionDirective, IgxListComponent, IgxListItemComponent, IgxListLineSubTitleDirective, IgxListLineTitleDirective, IgxListThumbnailDirective, IgxPrefixDirective, IgxRippleDirective, IgxSuffixDirective, IgxTabContentComponent, IgxTabHeaderComponent, IgxTabHeaderIconDirective, IgxTabHeaderLabelDirective, IgxTabItemComponent, IgxTabsComponent, ITabsSelectedIndexChangingEventArgs, ITabsSelectedItemChangeEventArgs } from 'igniteui-angular';

@Component({
    selector: 'app-tabs-sample',
    styleUrls: ['tabs.sample.scss'],
    templateUrl: 'tabs.sample.html',
    encapsulation: ViewEncapsulation.None,
    imports: [IgxButtonDirective, IgxTabsComponent, IgxTabItemComponent, IgxTabHeaderComponent, IgxRippleDirective, IgxIconComponent, IgxTabHeaderIconDirective, IgxIconButtonDirective, IgxTabHeaderLabelDirective, IgxTabContentComponent, IgxListComponent, NgFor, IgxListItemComponent, IgxAvatarComponent, IgxListThumbnailDirective, IgxListLineTitleDirective, IgxListLineSubTitleDirective, IgxListActionDirective, IgxButtonGroupComponent, IgxPrefixDirective, IgxSuffixDirective, IgxGridComponent]
})
export class TabsSampleComponent implements OnInit {

    @ViewChild('tabsNew')
    private tabs: IgxTabsComponent;

    @ViewChild('dynamicTabs')
    private dynamicTabs: IgxTabsComponent;

    public tab2Label = 'Tab 2';

    public tabAlignment = 'start';

    public tabAlignments = [
        { label: 'start', selected: this.tabAlignment === 'start', togglable: true },
        { label: 'center', selected: this.tabAlignment === 'center', togglable: true },
        { label: 'end', selected: this.tabAlignment === 'end', togglable: true },
        { label: 'justify', selected: this.tabAlignment === 'justify', togglable: true }
    ];

    public scrollableTabs = [];

    public data = [
        { ID: 'ALFKI', CompanyName: 'Alfreds Futterkiste', ContactName: 'Maria Anders', ContactTitle: 'Sales Representative', Address: 'Obere Str. 57', City: 'Berlin', Region: null, PostalCode: '12209', Country: 'Germany', Phone: '030-0074321', Fax: '030-0076545' },
        { ID: 'ANATR', CompanyName: 'Ana Trujillo Emparedados y helados', ContactName: 'Ana Trujillo', ContactTitle: 'Owner', Address: 'Avda. de la Constitución 2222', City: 'México D.F.', Region: null, PostalCode: '05021', Country: 'Mexico', Phone: '(5) 555-4729', Fax: '(5) 555-3745' },
        { ID: 'ANTON', CompanyName: 'Antonio Moreno Taquería', ContactName: 'Antonio Moreno', ContactTitle: 'Owner', Address: 'Mataderos 2312', City: 'México D.F.', Region: null, PostalCode: '05023', Country: 'Mexico', Phone: '(5) 555-3932', Fax: null },
        { ID: 'AROUT', CompanyName: 'Around the Horn', ContactName: 'Thomas Hardy', ContactTitle: 'Sales Representative', Address: '120 Hanover Sq.', City: 'London', Region: null, PostalCode: 'WA1 1DP', Country: 'UK', Phone: '(171) 555-7788', Fax: '(171) 555-6750' },
        { ID: 'BERGS', CompanyName: 'Berglunds snabbköp', ContactName: 'Christina Berglund', ContactTitle: 'Order Administrator', Address: 'Berguvsvägen 8', City: 'Luleå', Region: null, PostalCode: 'S-958 22', Country: 'Sweden', Phone: '0921-12 34 65', Fax: '0921-12 34 67' },
        { ID: 'BLAUS', CompanyName: 'Blauer See Delikatessen', ContactName: 'Hanna Moos', ContactTitle: 'Sales Representative', Address: 'Forsterstr. 57', City: 'Mannheim', Region: null, PostalCode: '68306', Country: 'Germany', Phone: '0621-08460', Fax: '0621-08924' },
        { ID: 'BLONP', CompanyName: 'Blondesddsl père et fils', ContactName: 'Frédérique Citeaux', ContactTitle: 'Marketing Manager', Address: '24, place Kléber', City: 'Strasbourg', Region: null, PostalCode: '67000', Country: 'France', Phone: '88.60.15.31', Fax: '88.60.15.32' },
        { ID: 'BOLID', CompanyName: 'Bólido Comidas preparadas', ContactName: 'Martín Sommer', ContactTitle: 'Owner', Address: 'C/ Araquil, 67', City: 'Madrid', Region: null, PostalCode: '28023', Country: 'Spain', Phone: '(91) 555 22 82', Fax: '(91) 555 91 99' },
        { ID: 'BONAP', CompanyName: 'Bon app\'', ContactName: 'Laurence Lebihan', ContactTitle: 'Owner', Address: '12, rue des Bouchers', City: 'Marseille', Region: null, PostalCode: '13008', Country: 'France', Phone: '91.24.45.40', Fax: '91.24.45.41' },
        { ID: 'BOTTM', CompanyName: 'Bottom-Dollar Markets', ContactName: 'Elizabeth Lincoln', ContactTitle: 'Accounting Manager', Address: '23 Tsawassen Blvd.', City: 'Tsawassen', Region: 'BC', PostalCode: 'T2F 8M4', Country: 'Canada', Phone: '(604) 555-4729', Fax: '(604) 555-3745' },
        { ID: 'BSBEV', CompanyName: 'B\'s Beverages', ContactName: 'Victoria Ashworth', ContactTitle: 'Sales Representative', Address: 'Fauntleroy Circus', City: 'London', Region: null, PostalCode: 'EC2 5NT', Country: 'UK', Phone: '(171) 555-1212', Fax: null },
        { ID: 'CACTU', CompanyName: 'Cactus Comidas para llevar', ContactName: 'Patricio Simpson', ContactTitle: 'Sales Agent', Address: 'Cerrito 333', City: 'Buenos Aires', Region: null, PostalCode: '1010', Country: 'Argentina', Phone: '(1) 135-5555', Fax: '(1) 135-4892' },
        { ID: 'CENTC', CompanyName: 'Centro comercial Moctezuma', ContactName: 'Francisco Chang', ContactTitle: 'Marketing Manager', Address: 'Sierras de Granada 9993', City: 'México D.F.', Region: null, PostalCode: '05022', Country: 'Mexico', Phone: '(5) 555-3392', Fax: '(5) 555-7293' },
        { ID: 'CHOPS', CompanyName: 'Chop-suey Chinese', ContactName: 'Yang Wang', ContactTitle: 'Owner', Address: 'Hauptstr. 29', City: 'Bern', Region: null, PostalCode: '3012', Country: 'Switzerland', Phone: '0452-076545', Fax: null },
        { ID: 'COMMI', CompanyName: 'Comércio Mineiro', ContactName: 'Pedro Afonso', ContactTitle: 'Sales Associate', Address: 'Av. dos Lusíadas, 23', City: 'Sao Paulo', Region: 'SP', PostalCode: '05432-043', Country: 'Brazil', Phone: '(11) 555-7647', Fax: null },
        { ID: 'CONSH', CompanyName: 'Consolidated Holdings', ContactName: 'Elizabeth Brown', ContactTitle: 'Sales Representative', Address: 'Berkeley Gardens 12 Brewery', City: 'London', Region: null, PostalCode: 'WX1 6LT', Country: 'UK', Phone: '(171) 555-2282', Fax: '(171) 555-9199' },
        { ID: 'DRACD', CompanyName: 'Drachenblut Delikatessen', ContactName: 'Sven Ottlieb', ContactTitle: 'Order Administrator', Address: 'Walserweg 21', City: 'Aachen', Region: null, PostalCode: '52066', Country: 'Germany', Phone: '0241-039123', Fax: '0241-059428' },
        { ID: 'DUMON', CompanyName: 'Du monde entier', ContactName: 'Janine Labrune', ContactTitle: 'Owner', Address: '67, rue des Cinquante Otages', City: 'Nantes', Region: null, PostalCode: '44000', Country: 'France', Phone: '40.67.88.88', Fax: '40.67.89.89' },
        { ID: 'EASTC', CompanyName: 'Eastern Connection', ContactName: 'Ann Devon', ContactTitle: 'Sales Agent', Address: '35 King George', City: 'London', Region: null, PostalCode: 'WX3 6FW', Country: 'UK', Phone: '(171) 555-0297', Fax: '(171) 555-3373' },
        { ID: 'ERNSH', CompanyName: 'Ernst Handel', ContactName: 'Roland Mendel', ContactTitle: 'Sales Manager', Address: 'Kirchgasse 6', City: 'Graz', Region: null, PostalCode: '8010', Country: 'Austria', Phone: '7675-3425', Fax: '7675-3426' },
        { ID: 'FAMIA', CompanyName: 'Familia Arquibaldo', ContactName: 'Aria Cruz', ContactTitle: 'Marketing Assistant', Address: 'Rua Orós, 92', City: 'Sao Paulo', Region: 'SP', PostalCode: '05442-030', Country: 'Brazil', Phone: '(11) 555-9857', Fax: null },
        { ID: 'FISSA', CompanyName: 'FISSA Fabrica Inter. Salchichas S.A.', ContactName: 'Diego Roel', ContactTitle: 'Accounting Manager', Address: 'C/ Moralzarzal, 86', City: 'Madrid', Region: null, PostalCode: '28034', Country: 'Spain', Phone: '(91) 555 94 44', Fax: '(91) 555 55 93' },
        { ID: 'FOLIG', CompanyName: 'Folies gourmandes', ContactName: 'Martine Rancé', ContactTitle: 'Assistant Sales Agent', Address: '184, chaussée de Tournai', City: 'Lille', Region: null, PostalCode: '59000', Country: 'France', Phone: '20.16.10.16', Fax: '20.16.10.17' },
        { ID: 'FOLKO', CompanyName: 'Folk och fä HB', ContactName: 'Maria Larsson', ContactTitle: 'Owner', Address: 'Åkergatan 24', City: 'Bräcke', Region: null, PostalCode: 'S-844 67', Country: 'Sweden', Phone: '0695-34 67 21', Fax: null },
        { ID: 'FRANK', CompanyName: 'Frankenversand', ContactName: 'Peter Franken', ContactTitle: 'Marketing Manager', Address: 'Berliner Platz 43', City: 'München', Region: null, PostalCode: '80805', Country: 'Germany', Phone: '089-0877310', Fax: '089-0877451' },
        { ID: 'FRANR', CompanyName: 'France restauration', ContactName: 'Carine Schmitt', ContactTitle: 'Marketing Manager', Address: '54, rue Royale', City: 'Nantes', Region: null, PostalCode: '44000', Country: 'France', Phone: '40.32.21.21', Fax: '40.32.21.20' },
        { ID: 'FRANS', CompanyName: 'Franchi S.p.A.', ContactName: 'Paolo Accorti', ContactTitle: 'Sales Representative', Address: 'Via Monte Bianco 34', City: 'Torino', Region: null, PostalCode: '10100', Country: 'Italy', Phone: '011-4988260', Fax: '011-4988261' }
    ];
    public localData;
    public lastYear = new Date().getFullYear() - 1;
    public employeesHData = [
            {
              EmployeeID: '56250fa57ab1535722e564a6',
              FirstName: 'Downs',
              LastName: 'Holcomb',
              Country: 'Italy',
              Age: 35,
              RegisteredDate2: new Date(this.lastYear, 7, 25),
              IsActive2: false,
              EmployeeID2: '56250fa57ab1535722e564a6',
              FirstName2: 'Downs',
              LastName2: 'Holcomb',
              Country2: 'Italy',
              Age2: 35
            },
            {
              EmployeeID: '56250fa5c0fd04f12555d44d',
              FirstName: 'Mckenzie',
              LastName: 'Calderon',
              Country: 'USA',
              Age: 26,
              RegisteredDate: new Date(this.lastYear - 1, 9, 22),
              IsActive: false,
              RegisteredDate2: new Date(this.lastYear, 7, 25),
              IsActive2: false,
              EmployeeID2: '56250fa57ab1535722e564a6',
              FirstName2: 'Downs',
              LastName2: 'Holcomb',
              Country2: 'Italy',
              Age2: 35

            },
            {
              EmployeeID: '56250fa565a7bcc21f6bd15e',
              FirstName: 'Howell',
              LastName: 'Hawkins',
              Country: 'Canada',
              Age: 25,
              RegisteredDate: new Date(this.lastYear, 8, 8),
              IsActive: false,
              RegisteredDate2: new Date(this.lastYear, 7, 25),
              IsActive2: false,
              EmployeeID2: '56250fa57ab1535722e564a6',
              FirstName2: 'Downs',
              LastName2: 'Holcomb',
              Country2: 'Italy',
              Age2: 35
            },
            {
              EmployeeID: '56250fa5d71a83c33f3f6479',
              FirstName: 'Sheppard',
              LastName: 'Nicholson',
              Country: 'Italy',
              Age: 49,
              RegisteredDate: new Date(this.lastYear - 1, 6, 28),
              IsActive: false,
              RegisteredDate2: new Date(this.lastYear, 7, 25),
              IsActive2: false,
              EmployeeID2: '56250fa57ab1535722e564a6',
              FirstName2: 'Downs',
              LastName2: 'Holcomb',
              Country2: 'Italy',
              Age2: 35
            },
            {
              EmployeeID: '56250fa546abbe8c616d37eb',
              FirstName: 'Bettye',
              LastName: 'Trujillo',
              Country: 'Canada',
              Age: 37,
              RegisteredDate: new Date(new Date().setDate(-20)),
              IsActive: false,
              RegisteredDate2: new Date(this.lastYear, 7, 25),
              IsActive2: false,
              EmployeeID2: '56250fa57ab1535722e564a6',
              FirstName2: 'Downs',
              LastName2: 'Holcomb',
              Country2: 'Italy',
              Age2: 35
            }];

    public contacts: any[] = [{
        avatar: 'assets/images/avatar/1.jpg',
        favorite: true,
        key: '1',
        link: '#',
        phone: '770-504-2217',
        text: 'Terrance Orta'
    }, {
        avatar: 'assets/images/avatar/2.jpg',
        favorite: false,
        key: '2',
        link: '#',
        phone: '423-676-2869',
        text: 'Richard Mahoney'
    }, {
        avatar: 'assets/images/avatar/3.jpg',
        favorite: false,
        key: '3',
        link: '#',
        phone: '859-496-2817',
        text: 'Donna Price'
    }, {
        avatar: 'assets/images/avatar/4.jpg',
        favorite: false,
        key: '4',
        link: '#',
        phone: '901-747-3428',
        text: 'Lisa Landers'
    }];

    public tabsArray = [
        { name: 'Tab 1', selected: true },
        { name: 'Tab 2', selected: true }
    ];

    public ngOnInit(): void {
        for (let i = 0; i < 20; i++) {
            const tab = 'Tab ' + i;
            this.scrollableTabs.push(tab);
        }
        this.localData = this.employeesHData;
    }

    public addTab() {
        const contact = {
            text: 'John Doe',
            phone: '555-555-5555'
        };
        this.contacts.push(contact);

        requestAnimationFrame(() => {
            this.dynamicTabs.selectedIndex = this.contacts.length -1;
        });
    }

    public addSelectedTab() {
        this.tabsArray.forEach(t => {
            t.selected = false;
        });
        this.tabsArray.push({ name: 'New Tab', selected: true });
    }

    public closeTab(i: number) {
        this.contacts.splice(i, 1);
    }

    public changeSelectedIndex() {
        this.tabs.selectedIndex = 1;
    }

    public renameTab2() {
        this.tab2Label = 'Tab 2 Extra Long Header';
    }

    public changeTabSelected() {
        this.tabs.items.toArray()[1].selected = true;
    }

    public selectAlignment(event) {
        this.tabAlignment = this.tabAlignments[event.index].label;
    }

    public tabsSelectedIndexChanging(_args: ITabsSelectedIndexChangingEventArgs) {
        // if (args.newIndex === 1) {
        //     args.cancel = true;
        // }
    }

    public tabsSelectedItemChange(_args: ITabsSelectedItemChangeEventArgs) {
        // console.log(args);
    }
}

