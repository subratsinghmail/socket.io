const moment=require('moment');


//one can return an object in js
function format(username,text,id,status,time_sent,message_ID,read_status){
    return {
        username,
        text,
        time:time_sent,
        roomID:id,
        status:status,
        messageID:message_ID,
        read:read_status
    }   
}




function format_on_Connect(email,socketID,status,roomID){
    return {
        email,
        socketID,
        status,
        roomID
    }
}


module.exports={format,format_on_Connect};
