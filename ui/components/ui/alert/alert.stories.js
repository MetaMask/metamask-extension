import React from "react";
import Alert from ".";

export default {
    title:'Components/UI/Alert',
    id: __filename,
    component: Alert,
    argsTypes:{
        visible:{
            control:'boolean'
        }
    }
}

export const DefaultAlert = (args) => {
    return(
        <Alert {...args}/>
    )
}

DefaultAlert.storyName = 'Default';
DefaultAlert.args = {
    visible:true,
}