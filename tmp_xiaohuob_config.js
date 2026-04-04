/**
 * setter
 */

// åå§åéç½®
layui.define(['all'], function(exports){
  exports('setter', {
    paths: { // v1.9.0 åä»¥ä¸çæ¬çåæ³
      core: layui.cache.base + 'adminui/src/', // æ ¸å¿åºæå¨ç®å½
      views: layui.cache.base + 'views/', // ä¸å¡è§å¾æå¨ç®å½
      modules: layui.cache.base + 'modules/', // ä¸å¡æ¨¡åæå¨ç®å½
      base: layui.cache.base // è®°å½éæèµæºæå¨åºç¡ç®å½
    },
    /* v1.9.0 ä¹åçåæ³
    views: layui.cache.base + 'views/', // ä¸å¡è§å¾æå¨ç®å½
    base: layui.cache.base, // è®°å½éæèµæºæå¨åºç¡ç®å½
    */

    container: 'LAY_app', // å®¹å¨ID
    entry: 'index', // é»è®¤è§å¾æä»¶å
    engine: '.html', // è§å¾æä»¶åç¼å
    pageTabs: true, // æ¯å¦å¼å¯é¡µé¢éé¡¹å¡åè½ãåé¡µçä¸æ¨èå¼å¯
    refreshCurrPage: true, // å½è·³è½¬é¡µé¢ url ä¸å½åé¡µ url ç¸åæ¶ï¼æ¯å¦èªå¨æ§è¡å·æ°
    
    name: 'shark',
    tableName: 'justSharkIt', // æ¬å°å­å¨è¡¨å
    MOD_NAME: 'admin', // æ¨¡åäºä»¶å
    
    debug: false, // æ¯å¦å¼å¯è°è¯æ¨¡å¼ãå¦å¼å¯ï¼æ¥å£å¼å¸¸æ¶ä¼æåºå¼å¸¸ URL ç­ä¿¡æ¯
    interceptor: false, // æ¯å¦å¼å¯æªç»å¥æ¦æª
    
    // èªå®ä¹è¯·æ±å­æ®µ
    request: {
      tokenName: 'token' // èªå¨æºå¸¦ token çå­æ®µåãå¯è®¾ç½® false ä¸æºå¸¦ã
    },
    
    // èªå®ä¹ååºå­æ®µ
    response: {
      statusName: 'code', // æ°æ®ç¶æçå­æ®µåç§°
      statusCode: {
        ok: 0, // æ°æ®ç¶æä¸åæ­£å¸¸çç¶æç 
        logout: 1001 // ç»å½ç¶æå¤±æçç¶æç 
      },
      msgName: 'msg', // ç¶æä¿¡æ¯çå­æ®µåç§°
      dataName: 'data' // æ°æ®è¯¦æçå­æ®µåç§°
    },
    
    // ç¬ç«é¡µé¢è·¯ç±ï¼å¯éææ·»å ï¼æ éååæ°ï¼
    indPage: [
      '/login/admin', // ç»å¥é¡µ
      '/login/vip', // ç»å¥é¡µ
      '/test' //æ¯ä»æµè¯é¡µé¢
      ,'/testx' //æ¯ä»æµè¯é¡µé¢
      ,'/api_doc' //å¯¹æ¥ææ¡£
    ],
    
    // éç½®ä¸å¡æ¨¡åç®å½ä¸­çç¹æ®æ¨¡å
    extend: {
      layim: 'layim/layim' // layim
    },
    
    // ä¸»é¢éç½®
    theme: {
      // åç½®ä¸»é¢éè²æ¹æ¡
      color: [{
        main: 'black', // ä¸»é¢è²
        selected: '#16baaa', // éä¸­è²
        alias: 'default' // é»è®¤å«å
      },{
        main: '#03152A',
        selected: '#3B91FF',
        alias: 'dark-blue' // èè
      },{
        main: '#2E241B',
        selected: '#A48566',
        alias: 'coffee' // åå¡
      },{
        main: '#50314F',
        selected: '#7A4D7B',
        alias: 'purple-red' // ç´«çº¢
      },{
        main: '#344058',
        logo: '#1E9FFF',
        selected: '#1E9FFF',
        alias: 'ocean' // æµ·æ´
      },{
        main: '#3A3D49',
        logo: '#2F9688',
        selected: '#16b777',
        alias: 'green' // å¢¨ç»¿
      },{
        main: '#20222A',
        logo: '#F78400',
        selected: '#F78400',
        alias: 'red' // æ©è²
      },{
        main: '#28333E',
        logo: '#AA3130',
        selected: '#AA3130',
        alias: 'fashion-red' // æ¶å°çº¢
      },{
        main: '#24262F',
        logo: '#3A3D49',
        selected: '#16baaa',
        alias: 'classic-black' // ç»å¸é»
      },{
        logo: '#226A62',
        header: '#2F9688',
        alias: 'green-header' // å¢¨ç»¿å¤´
      },{
        main: '#344058',
        logo: '#0085E8',
        selected: '#1E9FFF',
        header: '#1E9FFF',
        alias: 'ocean-header' // æµ·æ´å¤´
      },{
        header: '#393D49',
        alias: 'classic-black-header' // ç»å¸é»
      },{
        main: '#50314F',
        logo: '#50314F',
        selected: '#7A4D7B',
        header: '#50314F',
        alias: 'purple-red-header' // ç´«çº¢å¤´
      },{
        main: '#28333E',
        logo: '#28333E',
        selected: '#AA3130',
        header: '#AA3130',
        alias: 'fashion-red-header' // æ¶å°çº¢å¤´
      },{
        main: '#28333E',
        logo: '#16baaa',
        selected: '#16baaa',
        header: '#16baaa',
        alias: 'green-header' // å¢¨ç»¿å¤´
      },{
        main: '#393D49',
        logo: '#393D49',
        selected: '#16baaa',
        header: '#23262E',
        alias: 'Classic-style1' // ç»å¸é£æ ¼1
      },{
        main: '#001529',
        logo: '#001529',
        selected: '#1890FF',
        header: '#1890FF',
        alias: 'Classic-style2' // ç»å¸é£æ ¼2
      },{
        main: '#25282A',
        logo: '#25282A',
        selected: '#35BDB2',
        header: '#35BDB2',
        alias: 'Classic-style3' // ç»å¸é£æ ¼3
      }],
      
      // åå§çé¢è²ç´¢å¼ï¼å¯¹åºä¸é¢çéè²æ¹æ¡æ°ç»ç´¢å¼
      // å¦ææ¬å°å·²ç»æä¸»é¢è²è®°å½ï¼åä»¥æ¬å°è®°å½ä¸ºä¼åï¼é¤éè¯·æ±æ¬å°æ°æ®ï¼localStorageï¼
      initColorIndex: 0
    }
  });
});

