import { connect } from 'react-redux';

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
    return { actions: {
        
    } }
}

export default function map(component){
    return connect(mapStateToProps, mapDispatchToProps)(component);
}