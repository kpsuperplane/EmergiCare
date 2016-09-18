import React, { Component } from 'react';
export default class Urgency extends Component{
    render(){
        const { urgency, onChange } = this.props;
        return (<div className={"urgency " + ["unknown", "low", "medium", "high"][urgency]}>
            <select value={urgency} onChange={onChange} disabled={onChange?false:true}>
                <option value={0}>Unknown Urgency</option> 
                <option value={1}>Low Urgency</option> 
                <option value={2}>Medium Urgency</option> 
                <option value={3}>High Urgency</option> 
            </select>
            <div className="urgency-bar" style={{width: (urgency ? urgency : 3)*33.33 + "%"}}></div>
        </div>);
    }
}