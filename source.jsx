var store = {
    contacts: [],
    loans: []
}

var refreshContacts = function(){
    cozysdk.run("contact", "all", function(err, fetchedContacts) {
        if(err) return alert(err);
        store.contacts = fetchedContacts.map((row) => row.value);
        render()
    });
}

var refreshLoans = function(){
    options = {include_docs: true};
    cozysdk.run("loan", "all", options, function(err, fetchedLoans) {
        if(err) return alert(err);
        store.loans = fetchedLoans.map((row) => row.doc)
        render()
    });
}


var ContactSelector = function({contacts, valueLink}){
    console.log(contacts);
    return <select valueLink={valueLink}>
        {contacts.map( function (c) {
            return <option key={c._id} value={c._id}>{c.fn}</option>;
        })}
    </select>
}

class LoanView extends React.Component {

    constructor() {
        super()
        this.onDelete = this.onDelete.bind(this)
    }

    onDelete(){
        cozysdk.destroy('loan', this.props.loan._id, function(err){
            if(err) alert(err)
            else refreshLoans()
        });
    }

    render() {
        let contact = store.contacts.find((c) => c._id === this.props.loan.contactid)
        console.log("one loan", contact);
        let name = contact ? contact.fn : 'unknown(' + this.props.loan.contactid + ')'
        return <li className="loan">
            Loaned to <strong>{name}</strong> : {this.props.loan.item}
            <a onClick={this.onDelete}> &times; </a>
        </li>
    }
}


var Form = React.createClass({

    mixins: [React.addons.LinkedStateMixin],

    getInitialState: function(){
        return {
            itemName: '',
            selectedContactID: this.props.contacts[1]._id
        }
    },

    onValidateForm (e){
        e.preventDefault()
        var newLoan = {
            contactid: this.state.selectedContactID,
            item: this.state.itemName
        };
        cozysdk.create('loan', newLoan, function(err) {
            if (err) this.setState({error: err})
            refreshLoans()
        });
    },

    render: function() {
        var errorPanel = null
        if (this.state.error) errorPanel = <p style="color:red">
            {this.state.error}</p>

        return <form id="loaner" onSubmit={this.onValidateForm}>
            <label> I am loaning
                <input type="text" valueLink={this.linkState('itemName')} />
            </label>
            <label> To
                <ContactSelector
                    contacts={this.props.contacts}
                    valueLink={this.linkState('selectedContactID')} />
            </label>
            <button>Add</button>
            {errorPanel}
        </form>;
    }

})

class Application extends React.Component{


    render () {
        let loanviews = this.props.loans.map( function (loan) {
            return <LoanView key={loan._id} loan={loan} />
        })

        return <div id="application">
            <Form contacts={this.props.contacts}/>
            <ul className="loan-list">
                {loanviews.length ? loanviews :
                    <p> You've got everything </p>
                }
            </ul>
        </div>
    }
}


refreshContacts()
map = 'function(doc) { emit(doc._id, null); }';
cozysdk.defineRequest('loan', 'all', map, function(err) {
    refreshLoans()
});

var render = function(){
    ReactDOM.render(<Application {...store }/>, document.getElementById('example'));
}
