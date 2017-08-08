(function () {
      
      const {BrowserWindow} = require('electron').remote; 
      
      function init() { 

        document.getElementById("min-btn").addEventListener("click", function (e) {
					var window = BrowserWindow.getFocusedWindow();
          window.minimize(); 
        });
        
        document.getElementById("max-btn").addEventListener("click", function (e) {
          var window = BrowserWindow.getFocusedWindow();
          if (!window.isMaximized()) {
            window.maximize();
          } else {
            window.unmaximize();
          }	 
        });
        
        document.getElementById("close-btn").addEventListener("click", function (e) {
          var window = BrowserWindow.getFocusedWindow();
					window.close();
        }); 

        document.getElementById("donate").addEventListener("click", function(e){
          //var window = BrowserWindow.getFocusedWindow();
          require('electron').shell.openExternal('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=danthemangall@gmail.com&lc=US&item_name=Deadass-Splash&no_note=0&currency_code=USD&bn=PP-DonationsBF:btn_donate_LG.gif:NonHostedGuest&submit.x=54&submit.y=12')
        })
      }; 
      
      document.onreadystatechange = function () {
        if (document.readyState == "complete") {
          init(); 
        }
      };
})();