import React, { Component } from 'react';
import Main from './fragments/Main';
import { createStore, combineReducers  } from 'redux';
import { Provider } from 'react-redux';
import Firedux from 'firedux';
import Firebase from 'firebase';
import dataReducer from './reducers';
import './App.css';

/**
 * Or for Firebase 3.x:, e.g.:
 */
var app = Firebase.initializeApp({
  apiKey: "AIzaSyBcBiB--dCNwo9tl6uOhj9r90H79_JIDMc",
  authDomain: "emergicare-17207.firebaseapp.com",
  databaseURL: "https://emergicare-17207.firebaseio.com"
})
var ref = app.database().ref();
const firedux = new Firedux({
  ref,
  omit: ['$localState'] // Properties to reserve for local use and not sync with Firebase.
})

const reducer = combineReducers({
  firedux: firedux.reducer(),
  data: dataReducer
});
const store = createStore(reducer);
firedux.dispatch = store.dispatch;
firedux.watch('/');

firedux.init();

window.firedux = firedux;

class App extends Component {
  render() {
    return (
      <Provider store={store} key="provider">
        <Main />
      </Provider> 
    );
  }
}

export default App;
