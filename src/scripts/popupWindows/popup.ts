// only run this script in child windows
if (window.opener) {
  import("./runTooltipScript")
    .then(({ runTooltipScript }) => {
      const tooltipEl = document.createElement("aside");
      tooltipEl.id = "tooltip";
      tooltipEl.setAttribute("role", "tooltip");
      tooltipEl.setAttribute("popover", "manual");
      document.body.appendChild(tooltipEl);
      runTooltipScript();
    })
    .catch((error) => {
      console.error("Error running tooltip script:", error);
    });
} else {
  console.error("This script should only be run in a child window.");
}
