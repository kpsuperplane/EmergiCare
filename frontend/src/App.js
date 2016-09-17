import React, { Component } from 'react';
import Main from './fragments/Main';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from './reducers';
import './App.css';

const store = createStore(reducer);

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
