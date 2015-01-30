
const Soup = imports.gi.Soup;
const Lang = imports.lang;

function XMLHttpRequest(settings) {
    this._init(settings);
    return this;
}

//
XMLHttpRequest.prototype = {
    _init:function(settings) {
        this._settings=settings;
    },
    constructor : XMLHttpRequest,

    readyState:0,
    getResponseHeaders:0,
    status:200,
    responseText:undefined,
    responseXML:undefined,
    _httpSession:undefined,
    open:function(method,uri,async,user,password) {
        async=false;
        this.method=method;
        this.uri=uri;
        this.async=async;
        try {
        if (async==true)
            this._httpSession=new Soup.SessionAsync();
        else
            this._httpSession=new Soup.SessionSync();
        Soup.Session.prototype.add_feature.call(this._httpSession, new Soup.ProxyResolverDefault());
        }catch (e) {
            print ("failed");
        }
        return this;
    },
    send:function(query) {
        try {
        var request = Soup.Message.new(this.method, this.uri);
        if (this.async==true) {
            this._httpSession.queue_message(request,
                function(_httpSession, message) { print('Download is done'); }
            );
        }
        else {
            this._httpSession.send_message(request);
        }
        } catch (e) {
            print("failed");
        }
        print("DONE");
        return this;
    },
    setRequestHeader:function(name,value) {
    }
}

if (exports) {
    exports.XMLHttpRequest = XMLHttpRequest;
}
