import React, { Component } from 'react';
import map from '../map';
import Helpers from '../Helpers';
import _ from 'lodash';
import Urgency from './Urgency';
import police from '../img/police.png';
import request from 'superagent'; 
import { default as ScriptjsLoader } from "react-google-maps/lib/async/ScriptjsLoader";
import { GoogleMap, Circle, InfoWindow, Marker, Polyline } from 'react-google-maps';
import geodist from 'geodist';
class Main extends Component{
    constructor(props){
        super(props);
        this.state = {
            active: 0,
            show: {},
            hover: -1,
            highlighted: -1,
            highlightedPosition: {}
        };
      window.that = this;
    }
    changeTab(tab){
        this.setState({active: tab});
    }
    toggle(id){
        const state = _.cloneDeep(this.state);
        state.show[id] = !state.show[id];
        this.setState(state);
    }
    hover(id, value){
        const state = _.cloneDeep(this.state);
        state.hover = value ? id : -1;
        this.setState(state);
    }
    markerDragged(index, e){
        const { props } = this;
        const calls = props.firedux.data[""][""].calls;
        var state = _.cloneDeep(this.state);
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        var old = state.highlighted;
        state.highlighted = -1; 
        for(var index in calls){
          const call = calls[index];
          const dist = geodist({lat: lat, lon: lng}, {lat: call.latitude, lon: call.longitude}, {exact: true, unit: 'km'});
          if(dist < 0.3){
            state.highlighted = index;
            state.highlightedPosition = {lat: lat, lon: lng};
            break;
          }
        }
        if(old != state.highlighted){
          this.setState(state);
        } 
    }
    markerDragStopped(index, e){
        var state = _.cloneDeep(this.state);
        if(state.highlighted != -1){
            window.firedux.update('services/'+index, { handler: state.highlighted });
        } 
        state.highlighted = -1;
        this.setState(state);
    }
    unassign(index){
        window.firedux.update('services/'+index, { handler: "" });
    }
    resolve(index){
        request.post('/calls/resolve').type('form').send({ phoneNumber: index }).end();
    }
    changeUrgency(index, e){
        window.firedux.update('calls/'+index, { urgency: Number(e.target.value) });
    }
    render(){
        const {props, state, changeUrgency, changeTab, toggle, hover, markerDragged, markerDragStopped, unassign, resolve} = this;
        const instance = this;
        var services = [], calls = [];
        if(props.firedux.data[""]){
            services = props.firedux.data[""][""].services;
            calls = props.firedux.data[""][""].calls;
        }
        return (
            <div id="app">
                <div id="pane-info">
                    <div className="tabs">
                        <a href="#" className={state.active === 0 ? "active" : null} onClick={changeTab.bind(instance, 0)}>Calls</a>
                        <a href="#" className={state.active === 1 ? "active" : null} onClick={changeTab.bind(instance, 1)}>Services</a>
                    </div>
                    <div id="pane-scroll">
                        {state.active===0?_.map(calls, (call, index) => {
                            if(typeof state.show[index] === 'undefined') state.show[index] = false;
                                    
                            return (
                            <a key={"PANE-"+index} href="javascript:void(0);" className={"item" + (state.hover[index] ? " hover" : "") + (state.show[index] ? " active" : "")} onClick={toggle.bind(instance, index)} onMouseEnter={hover.bind(instance, index, true)} onMouseLeave={hover.bind(instance, index, false)}>
                                <strong>{call.phoneNumber}</strong>
                                <div>{call.address}</div>
                                <Urgency urgency={call.urgency}/>
                                <div>Accuracy: {call.accuracy} Metres</div>
                            </a>
                        );}):_.map(services, (service, index) => {
                            if(typeof state.show[index] === 'undefined') state.show[index] = false;
                                    
                            return (
                            <a key={"PANE-"+index} href="javascript:void(0);" className={"item" + (state.show[index] ? " active" : "")}  onClick={toggle.bind(instance, index)}>
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
                                    key={index+'-circle'}
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
                                    icon={"//maps.google.com/mapfiles/ms/icons/"+(["yellow","blue","orange","red"][call.urgency])+"-dot.png"}
                                    position={{lat: call.latitude, lng: call.longitude}}
                                    onClick={toggle.bind(instance, index)}
                                >{(state.show[index]||state.hover === index)?(<InfoWindow
                                    key={index+'_info_window'}
                                    onCloseclick={toggle.bind(instance, index)}
                                >
                                    <div>
                                        <strong>{call.phoneNumber}</strong>
                                        <Urgency urgency={call.urgency} onChange={changeUrgency.bind(instance, index)}/>
                                        <div>Accuracy: {call.accuracy} Metres</div>
                                        <a href="javascript:void(0);" onClick={resolve.bind(instance, index)}>Resolve Call</a>
                                    </div>
                                </InfoWindow>):null}</Marker>];
                                if(state.highlighted === index){
                                  elems.push(<Circle
                                      key={index+'-circle-yellow'}
                                      center={{lat: call.latitude, lng: call.longitude}}
                                      radius={300}
                                      options={{ 
                                          fillColor: `yellow`,
                                          fillOpacity: 0.80,
                                          strokeColor: `yellow`,
                                          strokeOpacity: 1,
                                          strokeWeight: 1,
                                      }}
                                  />);
                                }
                                return elems;
                            })}
                            {_.map(services, (service, index) => {
                                var elems = [
                                <Marker
                                    position={state.highlighted === index ? state.highlightedPosition : {lat: service.latitude, lng: service.longitude}}
                                    onClick={toggle.bind(instance, index)}
                                    draggable={true}
                                    onDrag={markerDragged.bind(instance, index)}
                                    onDragend={markerDragStopped.bind(instance, index)}
                                    icon={{url: police, size: {width: 50, height:50}, anchor: {x: 25, y: 15}}}
                                >{(state.show[index])?(<InfoWindow
                                    key={index+'_info_window'}
                                    onCloseclick={toggle.bind(instance, index)}
                                >
                                    <div><strong>Unit {index}</strong><div>Status: {service.handler?("Responding to " + service.handler):"Available"} </div>{service.handler?(<a href="javascript:void(0);" onClick={unassign.bind(instance, index)}>Unassign</a>):null}</div>
                                </InfoWindow>):null}</Marker>];
                                if(service.handler && state.highlighted !== index){
                                  elems.push(<Polyline 
                                    path = {[
                                      {lat: service.latitude, lng: service.longitude},
                                      {lat: calls[service.handler].latitude, lng: calls[service.handler].longitude}
                                    ]}
                                    options={{
                                      strokeColor: "red",
                                      strokeOpacity: 0.8,
                                      strokeWeight: 3
                                    }}
                                  />);
                                }
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