import Constants from './constants';
import _ from 'lodash';
const defaultState = {
    calls: {
        23: {type: -1, location: {lat: 43.472572, lng: -80.546712}, accuracy: 100, number: "123-456-7890"}
    }, //id:{type: 1:police|2:ems|3:fire, location: (lat, lng), accuracy: 32m, number: "123-456-7890"}
    services: {} //id:{type: 1:police|2:ems|3:fire, location: (lat, lng), assigned: -1}
};
export default (state = defaultState, action) => {
    state = _.cloneDeep(state);
    switch (action.type) {
        case Constants.CALLS.UPDATE:
            state.calls = action.payload;
            break;
        case Constants.SERVICES.UPDATE:
            state.services = action.payload;
            break;
    }
    return state;
}