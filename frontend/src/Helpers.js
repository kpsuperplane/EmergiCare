export default {
    getType(type){
        switch(type){
            case 0: 
                return "Police";
            case 1:
                return "EMS";
            case 2:
                return "Fire";
            default:
                return "Unknown Issue";
        }
    }
};