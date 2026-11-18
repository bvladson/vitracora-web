export const GTM_ID = "GTM-5WZFCV6P";
export const GA4_MEASUREMENT_ID = "G-BP931PJG0R";
export const ADSENSE_CLIENT_ID = "ca-pub-8202925663264045";
export const READER_PRODUCT_ID = "CAow2uPHDA:openaccess";

// Define consent before the container runs. A new preference version asks
// returning visitors again because Google measurement is a new purpose.
export const GOOGLE_TAG_MANAGER_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
var vsbAnalyticsAllowed = document.cookie.split('; ').some(function(item){return item === 'vsb_cookie_consent_v2=accepted';});
var vsbAdsAllowed = document.cookie.split('; ').some(function(item){return item === 'vsb_advertising_consent_v1=accepted';});
window.adsbygoogle = window.adsbygoogle || [];
window.adsbygoogle.requestNonPersonalizedAds = 1;
window.adsbygoogle.pauseAdRequests = vsbAdsAllowed ? 0 : 1;
window.gtag('consent','default',{
  analytics_storage:vsbAnalyticsAllowed?'granted':'denied',
  ad_storage:vsbAdsAllowed?'granted':'denied',ad_user_data:'denied',ad_personalization:'denied',
  functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted'
});
window.gtag('set','ads_data_redaction',true);
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.dataset.vsbTag='gtm';j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
`;

export const READER_REVENUE_BOOTSTRAP = `
(self.SWG_BASIC = self.SWG_BASIC || []).push(function(basicSubscriptions){
  basicSubscriptions.init({
    type:'NewsArticle',
    isPartOfType:['Product'],
    isPartOfProductId:'${READER_PRODUCT_ID}',
    clientOptions:{theme:'light',lang:'pt-BR'}
  });
});
`;

// The shared consent defaults run before this configuration. GA4 handles
// page loads and History API navigation; dataLayer-only events stay with GTM.
export const GOOGLE_ANALYTICS_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', '${GA4_MEASUREMENT_ID}');
`;
