//
// xhr.js
//
// This file is part of gjs-commonjs.
//
// Adrian Marius Negreanu <groleo@gmail.com>
//
// Specification
//   https://xhr.spec.whatwg.org/
//
//

const Soup = imports.gi.Soup;

XMLHttpRequest = function(settings) {
    this._init(settings);
};

XMLHttpRequest.prototype = {
    Name:"XMLHttpRequest",
    _init:function(settings) {
        this._settings=settings;
    },
    response:undefined,
    responseText:undefined,
    responseXML:undefined,
    readyState:0,
    getResponseHeaders:0,
    status:200,
    responseType:"",
    //private
    _httpSession:undefined,
    _request_headers:new Array(),
    _response_headers:"",
    _set_ready_state:function(state) {
        this.readyState=state;
        if (this.onreadystatechange) this.onreadystatechange();
    },

    open:function(method,uri,async,user,password) {
        this._method=method;
        this._uri=uri;
        this._async=async;
        try {
            this._req = Soup.Message.new(this._method, this._uri);
            this._set_ready_state(0);

            this._httpSession=new Soup.Session();
            this._cookieJar=new Soup.CookieJarText({"filename":"cookies.txt","read_only":false,"accept_policy":1});
            Soup.Session.prototype.add_feature.call(this._httpSession, this._cookieJar);
            this._httpSession.user_agent="Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.2.13) Gecko/20101206 Ubuntu/10.04 (lucid) Firefox/3.6.13";
            this._httpSession.proxy_uri=new Soup.URI("http://proxy.jf.intel.com:911/");
            this._set_ready_state(1);
        }catch (e) {
            print ("xhr.open: failed:"+e);
        }
        return this;
    },

    send:function(body) {
        try {
            if (!!body) {
                if (body instanceof ArrayBuffer) {
                    var v = new Uint8Array(body);
                    var b = new Soup.Buffer(v);
                    this._req.request_body.append_buffer(b);
                    print("XHR: "+this._method+" "+this._uri);
                } else {
                    this._req.request_body.append(body);
                }
            }
            if (this._async==true) {
                this._set_ready_state(3);
                this._httpSession.queue_message(this._req,
                    function(_httpSession, rsp) {
                        this.status=rsp.status_code;

                        if (this.responseType==="arraybuffer") {
                            this.response = new ArrayBuffer(rsp.response_body.length);
                            this._ua = new Uint8Array(this.response);
                            for (var i=0;i<rsp.response_body.length; ++i) {
                                this._ua[i]=rsp.response_body_data[i];
                                print(rsp.response_body.data[i]);
                            }
                        } else if (this.responseType==="" || this.responseType==="text"){
                            this.response=rsp.response_body.data;
                            this.responseText=rsp.response_body.data;
                        }
                        var cookies=Soup.cookies_from_response (rsp);
                        for (var ci in cookies) {
                            cookies[ci].set_http_only(false);
                            if (cookies[ci].get_expires()==null)
                                cookies[ci].set_max_age(378432000);
                            this._cookieJar.add_cookie(cookies[ci]);
                        }
                        this._cookieJar.save();
                        var accum={};
                        rsp.response_headers.foreach(function(name,value) {
                            accum[name]=value;
                        });
                        this._response_headers=accum;
                        this._set_ready_state(4);
                        if (this.onload) this.onload();
                    }.bind(this)
                );
            }
            else {
                this._httpSession.send_message(this._req);
            }
        } catch (e) {
            print("xhr.send("+body+") failed:",e);
        }
        return this;
    },

    getResponseHeader:function(header) {
        return this._response_headers[header];
    },

    getAllResponseHeaders:function(){
        var _response_headers="";
        for ( var name in this._response_headers) {
            _response_headers+=name+":"+this._response_headers[name]+"\r\n";
        }
        return _response_headers;
    },

    setRequestHeader:function(name,value) {
        this._req.request_headers.append(name, value);
    }
}
;

if (this["exports"]) {
    exports.XMLHttpRequest = XMLHttpRequest;
}
