import server from '../server.mjs';
export default function handler(req,res){server.emit('request',req,res);}
