const dispatcher = document.currentScript;
const mobile = matchMedia('(max-width: 860px)').matches;
const script = document.createElement('script');
script.src = mobile ? dispatcher.dataset.mobileSrc : dispatcher.dataset.desktopSrc;
script.async = false;
document.head.append(script);
