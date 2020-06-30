const App = function() {
  const json = {
    labels: {
     axis: { x: "days", y: "sales" }
    },
    series: [
      {
        color: "steelblue", label: "apple", values: [
          ["2020-01-01", 164], ["2020-02-01", 266], ["2020-03-01", 234], ["2020-04-01", 660], ["2020-05-01", 376], 
          ["2020-06-01", 837], ["2020-07-01", 233], ["2020-08-01", 160]
        ]
      },
      {
        color: "steelblue", label: "pear", values: [
          ["2020-01-01", 137], ["2020-02-01", 236], ["2020-03-01", 217], ["2020-04-01", 633], ["2020-05-01", 350], 
          ["2020-06-01", 900], ["2020-07-01", 987], ["2020-08-01", 970]
        ]
      },
      {
        color: "steelblue", label: "peach", values: [
          ["2020-01-01", 122], ["2020-02-01", 205], ["2020-03-01", 189], ["2020-04-01", 638], ["2020-05-01", 315],
          ["2020-06-01", 812], ["2020-07-01", 109], ["2020-08-01", 781]
        ]
      },
      {
        color: "steelblue", label: "grapes", values: [
          ["2020-01-01", 100], ["2020-02-01", 171], ["2020-03-01", 194], ["2020-04-01", 553], ["2020-05-01", 312],
          ["2020-06-01", 832], ["2020-07-01", 970], ["2020-08-01", 704]
        ]
      },
      {
        color: "steelblue", label: "melon", values: [
          ["2020-01-01", 119], ["2020-02-01", 191], ["2020-03-01", 182], ["2020-04-01", 524], ["2020-05-01", 335],
          ["2020-06-01", 841], ["2020-07-01", 898], ["2020-08-01", 532]
        ]
      }
     ]
  };

  function start () {
    page();
    menu();

    const line = new chart.Linechart({
      container: document.getElementById("chart"),
      data: json,
      margin: { bottom: 30, left: 35, right: 30, top: 30 }
    });

    line.draw();
  }

  function menu() {
    const menu = document.querySelector(".menu");
    const menuButton = document.querySelector(".menu-button");

    if (menu && menuButton) {
      menuButton.addEventListener("click", function(e) {
        e.stopImmediatePropagation();
        menu.classList.toggle("ready");
      });
      menu.addEventListener("click", function(e) { e.stopImmediatePropagation(); });
    }
    window.addEventListener("hide-menu", function() { menu.classList.add("ready"); });
  }

  function page() {
    const chart = document.getElementById("chart");
    
    chart.addEventListener("click", function() {
      window.dispatchEvent(new CustomEvent("hide-menu"));
    });

    window.addEventListener("line-selected", function(e) {
      console.log(e.detail.id + " was selected.");
    });
  }

  App.start = start;

  return App;
};
