function corsLoad(url, fn) {
    var iframe = document.createElement('iframe'),
    dataLoaded = false,
    onload = function() {
        if (dataLoaded) {
            fn(iframe.contentWindow.name)
        }
        else {
            dataLoaded = true;
            iframe.contentWindow.location = "http://app.com/proxy.html";
        }
    };
    iframe.style.display = 'none';
    iframe.onload  = onload;
    iframe.src = url;
    document.body.appendChild(iframe);
}
