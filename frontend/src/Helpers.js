export default {
    getType(type){
        switch(type){
            case 1: 
                return "Police";
            case 2:
                return "EMS";
            case 3:
                return "Fire";
            default:
                return "Unknown Issue";
        }
    }
};