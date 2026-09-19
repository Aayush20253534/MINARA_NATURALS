// Test-only auth/checkout contract fixture. This does not prove native Medusa or gateway integration.
import { randomUUID } from "node:crypto";
export function customerFixture({carts,products,json,totals}){
 const customers=new Map(),tokens=new Map(),identities=new Map(),resets=new Map(),wishlists=new Map(),orders=new Map();
 let enabled=true,shipping=true,gatewayMode="captured",failComplete=false;
 return async(req,res,url,body)=>{
  const token=req.headers.authorization?.replace(/^Bearer /,"");const email=tokens.get(token);const customer=customers.get(email);
  const deny=()=>json(res,{message:"Unauthorized"},401);
  if(url.pathname==="/__qa/account-control"){
   if(body.enabled!==undefined)enabled=body.enabled;if(body.shipping!==undefined)shipping=body.shipping;if(body.gatewayMode)gatewayMode=body.gatewayMode;if(body.failComplete!==undefined)failComplete=body.failComplete;
   json(res,{ok:true,resets:[...resets.entries()].map(([token,email])=>({token,email}))});return true;
  }
  if(url.pathname.startsWith("/auth/customer/emailpass")){
   if(url.pathname.endsWith("/register")){if(identities.has(body.email)){json(res,{},400);return true;}identities.set(body.email,body.password);const t=randomUUID();tokens.set(t,body.email);json(res,{token:t});return true;}
   if(url.pathname.endsWith("/reset-password")){if(identities.has(body.identifier))resets.set(randomUUID(),body.identifier);json(res,{},201);return true;}
   if(url.pathname.endsWith("/update")){const e=resets.get(token);if(!e){json(res,{},401);return true;}identities.set(e,body.password);resets.delete(token);json(res,{success:true});return true;}
   if(identities.get(body.email)!==body.password){deny();return true;}const t=randomUUID();tokens.set(t,body.email);json(res,{token:t});return true;
  }
  if(url.pathname==="/store/customers"&&req.method==="POST"){if(!email){deny();return true;}const c={...body,id:`cus_${randomUUID()}`,addresses:[]};customers.set(email,c);json(res,{customer:c});return true;}
  if(url.pathname.startsWith("/store/customers/me")){
   if(!customer){deny();return true;}
   if(url.pathname.includes("/addresses")){const id=url.pathname.split("/")[5];if(req.method==="GET")json(res,{addresses:customer.addresses});else if(req.method==="DELETE"){customer.addresses=customer.addresses.filter(a=>a.id!==id);json(res,{deleted:true});}else{if(id&&!customer.addresses.some(a=>a.id===id)){json(res,{},404);return true;}const address={...body,id:id||`caaddr_${randomUUID()}`};customer.addresses=customer.addresses.filter(a=>a.id!==id);customer.addresses.push(address);json(res,{customer});}return true;}
   if(req.method==="POST")Object.assign(customer,body);json(res,{customer});return true;
  }
  if(url.pathname==="/store/minara/wishlist"){if(!customer){deny();return true;}const saved=wishlists.get(customer.id)||new Set();wishlists.set(customer.id,saved);if(req.method==="POST"){if(body.saved)saved.add(body.product_id);else saved.delete(body.product_id);json(res,{saved:body.saved});}else json(res,{products:products.filter(p=>saved.has(p.id))});return true;}
  if(url.pathname==="/store/minara/checkout"){json(res,{enabled});return true;}
  if(url.pathname==="/store/payment-providers"){json(res,{payment_providers:[{id:"pp_cashfree_cashfree"}]});return true;}
  if(url.pathname.startsWith("/store/orders")){if(!customer){deny();return true;}const id=url.pathname.split("/")[3];if(id){const order=orders.get(id);if(!order||order.customer_id!==customer.id)json(res,{},404);else json(res,{order});}else{const all=[...orders.values()].filter(o=>o.customer_id===customer.id);json(res,{orders:all.slice(Number(url.searchParams.get("offset"))||0,10),count:all.length});}return true;}
  if(url.pathname==="/store/shipping-options"){json(res,{shipping_options:shipping?[{id:"so_standard",name:"Standard delivery",amount:49,price_type:"flat",type:{description:"Tracked delivery"}}]:[]});return true;}
  if(url.pathname.startsWith("/store/payment-collections")){
   if(!customer){deny();return true;}if(!enabled){json(res,{},503);return true;}
   const id=url.pathname.split("/")[3];const cart=id?[...carts.values()].find(c=>c.payment_collection?.id===id):carts.get(body.cart_id);
   if(!cart||cart.customer_id!==customer.id){json(res,{},404);return true;}
   if(!id)cart.payment_collection={id:`pay_col_${randomUUID()}`,payment_sessions:[]};
   else if(!cart.payment_collection.payment_sessions.length)cart.payment_collection.payment_sessions.push({id:`payses_${randomUUID()}`,provider_id:body.provider_id,status:"pending",data:{order_id:`mn_${randomUUID().replaceAll("-","").slice(0,32)}`,amount:cart.total,currency:"INR",payment_session_id:`session_${randomUUID().replaceAll("-","")}`,mode:"sandbox"}});
   json(res,{payment_collection:cart.payment_collection});return true;
  }
  const match=url.pathname.match(/^\/store\/carts\/(cart_[\w-]+)(?:\/(.*))?$/);
  if(match){const cart=carts.get(match[1]);if(!cart)return false;if(cart.customer_id&&cart.customer_id!==customer?.id){json(res,{},404);return true;}
   if(match[2]==="customer"){if(!customer){deny();return true;}cart.customer_id=customer.id;json(res,{cart});return true;}
   if(match[2]==="complete"){if(!enabled||!customer){deny();return true;}if(cart.completed_at){json(res,{type:"order",order:orders.get(cart.order_id)});return true;}if(gatewayMode!=="captured"||!cart.payment_collection?.payment_sessions?.length){json(res,{type:"cart",cart,error:{type:"payment_requires_more"}});return true;}const order={...structuredClone(cart),id:`order_${randomUUID()}`,display_id:orders.size+1001,created_at:new Date().toISOString(),status:"pending",payment_status:"captured",fulfillment_status:"not_fulfilled",fulfillments:[]};orders.set(order.id,order);cart.completed_at=order.created_at;cart.order_id=order.id;if(failComplete){failComplete=false;json(res,{},503);}else json(res,{type:"order",order});return true;}
   if(req.method!=="GET"&&cart.payment_collection?.payment_sessions.length){json(res,{message:"Payment has started"},409);return true;}
   if(match[2]==="shipping-methods"){cart.shipping_methods=[{id:"sm_fixture",shipping_option_id:body.option_id,name:"Standard delivery",amount:49}];totals(cart);json(res,{cart});return true;}
   if(!match[2]&&req.method==="POST"){Object.assign(cart,body);cart.shipping_methods=[];totals(cart);json(res,{cart});return true;}
  }
  return false;
 };
}
