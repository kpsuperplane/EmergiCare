import React, { Component } from 'react';
import map from '../map';
import Helpers from '../Helpers';
import _ from 'lodash';
import police from '../img/police.png';
import { default as ScriptjsLoader } from "react-google-maps/lib/async/ScriptjsLoader";
import { GoogleMap, Circle, InfoWindow, Marker } from 'react-google-maps';
class Main extends Component{
    constructor(props){
        super(props);
        this.state = {
            active: 0,
            show: {},
            hover: {}
        };
    }
    changeTab(tab){
        this.setState({active: tab});
    }
    toggle(id){
        const state = _.cloneDeep(this.state);
        state.show[id] = !state.show[id];
        this.setState(state);
    }
    hover(id){
        const state = _.cloneDeep(this.state);
        state.hover[id] = !state.hover[id];
        this.setState(state);
    }
    render(){
        const {props, state, changeTab, toggle, hover} = this;
        const instance = this;
        var services = [], calls = [];
        if(props.firedux.data[""]){
            services = props.firedux.data[""][""].services;
            calls = props.firedux.data[""][""].calls;
        }
        console.log(services);
        return (
            <div id="app">
                <div id="pane-info">
                    <div className="tabs">
                        <a href="#" className={state.active === 0 ? "active":null} onClick={changeTab.bind(instance, 0)}>Calls</a>
                        <a href="#" className={state.active === 1 ? "active":null} onClick={changeTab.bind(instance, 1)}>Services</a>
                    </div>
                    <div id="pane-scroll">
                        {state.active===0?_.map(calls, (call, index) => {
                            if(typeof state.show[index] === 'undefined') state.show[index] = false;
                            if(typeof state.hover[index] === 'undefined') state.hover[index] = false;
                                    
                            return (
                            <a key={"PANE-"+index} href="javascript:void(0);" className={"item" + (state.hover[index] ? " hover" : "") + (state.show[index] ? " active" : "")} onClick={toggle.bind(instance, index)} onMouseEnter={hover.bind(instance, index)} onMouseLeave={hover.bind(instance, index)}>
                                <strong>{call.phoneNumber}</strong>
                                <div>{Helpers.getType(call.type)} | {call.latitude}</div>
                                <div>Accuracy: {call.accuracy} Metres</div>
                            </a>
                        );}):_.map(services, (service, index) => {
                            if(typeof state.show[index] === 'undefined') state.show[index] = false;
                            if(typeof state.hover[index] === 'undefined') state.hover[index] = false;
                                    
                            return (
                            <a key={"PANE-"+index} href="javascript:void(0);" className={"item" + (state.hover[index] ? " hover" : "") + (state.show[index] ? " active" : "")}  onClick={toggle.bind(instance, index)}>
                                <strong>Unit {index}</strong>
                                <div>{Helpers.getType(service.type)} | {service.latitude}</div>
                                <div>Status: {service.occupancy_status?"Busy":"Available"} </div>
                            </a>
                        );})}
                    </div>
                </div>
                <div id="pane-map">
                    <ScriptjsLoader
                        hostname={"maps.googleapis.com"}
                        pathname={"/maps/api/js"}
                        query={{libraries: "geometry,drawing,places"}}
                        loadingElement={
                            <div>
                                Loading...
                            </div>
                        }
                        style={{height: "100%"}} 
                        containerElement={
                            <div style={{height: "100%"}} />
                        }
                        googleMapElement={
                            <GoogleMap      
                            defaultZoom={13}
                            defaultCenter={{ lat: 43.464461, lng: -80.524106 }}
                            onClick={props.onMapClick}
                            >
                            {_.map(calls, (call, index) => {
                                var elems = [
                                <Circle
                                    key="circle"
                                    center={{lat: call.latitude, lng: call.longitude}}
                                    radius={call.accuracy}
                                    options={{
                                        fillColor: `red`,
                                        fillOpacity: 0.20,
                                        strokeColor: `red`,
                                        strokeOpacity: 1,
                                        strokeWeight: 1,
                                    }}
                                />,
                                <Marker
                                    position={{lat: call.latitude, lng: call.longitude}}
                                    onClick={toggle.bind(instance, index)}
                                >{(state.show[index]||state.hover[index])?(<InfoWindow
                                    key={index+'_info_window'}
                                    onCloseclick={toggle.bind(instance, index)}
                                >
                                    <div><strong>{call.phoneNumber}</strong><br/>Type: {Helpers.getType(call.type)}<br/>Accuracy: {call.accuracy} Metres<br/></div>
                                </InfoWindow>):null}</Marker>];
                                return elems;
                            })}
                            {_.map(services, (service, index) => {
                                var elems = [
                                <Marker
                                    position={{lat: service.latitude, lng: service.longitude}}
                                    onClick={toggle.bind(instance, index)}
                                    icon={{url: police, size: {width: 50, height:50}}}
                                >{(state.show[index]||state.hover[index])?(<InfoWindow
                                    key={index+'_info_window'}
                                    onCloseclick={toggle.bind(instance, index)}
                                >
                                    <div><strong>Unit {index}</strong><div>Status: {service.occupancy_status?"Busy":"Available"} </div></div>
                                </InfoWindow>):null}</Marker>];
                                return elems;
                            })}
                            </GoogleMap>
                        }
                    />
                </div>
            </div>
        );
    }
}
export default map(Main);