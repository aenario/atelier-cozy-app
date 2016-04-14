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


function renderContacts({contacts}){
    return '<select id="contact-select">' +
        contacts.map(function (c) {
            return '<option value="' + c._id + '" >' + c.fn + '</option>'
        }).join('') +
    '</select>';
}

window.onLoanDelete = function onLoanDelete(){
    id = event.target.dataset.loanid
    console.log("THERE", id)
    cozysdk.destroy('loan', id, function(err){
        if(err) alert(err)
        else refreshLoans()
    });
}

window.onFormSubmit = function onFormSubmit() {
    event.preventDefault()
    var newLoan = {
        contactid: document.getElementById('contact-select').value,
        item: document.getElementById('item-input').value
    };
    cozysdk.create('loan', newLoan, function(err) {
        if (err) this.setState({error: err})
        refreshLoans()
    });

    return false
}

function renderLoan(loan) {
    let contact = store.contacts.find((c) => c._id === loan.contactid)
    let name = contact ? contact.fn : 'unknown(' + loan.contactid + ')'
    return '<li className="loan">' +
        'Loaned to <strong>' + name + '</strong> : ' + loan.item +
        '<a data-loanid="'+ loan._id + '" onClick="return onLoanDelete()"> &times; </a></li>'
}

function renderForm({contacts, error}) {
    return '<form id="loaner" onsubmit="return onFormSubmit()">' +
        '<label> I am loaning' +
            '<input type="text" id="item-input" />' +
        '</label>' +
        '<label> To' +
            renderContacts({contacts}) +
        '</label><button>Add</button>' +
        (error ? '<p>' + error + '</p>' : '') +
    '</form>'
}

function renderApp({loans, contacts}){
    let loanviews = loans.map(renderLoan).join('');
    return '<div id="application">' +
        renderForm({contacts: store.contacts}) +
        '<ul className="loan-list">' +
            (loanviews.length ? loanviews : '<p> You\'ve got everything</p>') +
        '</ul>' +
    '</div>'
}

refreshContacts()
map = 'function(doc) { emit(doc._id, null); }';
cozysdk.defineRequest('loan', 'all', map, function(err) {
    refreshLoans()
});

var render = function(){
    var txt = renderApp(store)
    console.log("tete", renderApp, txt);
    document.getElementById('example').innerHTML = txt
}
