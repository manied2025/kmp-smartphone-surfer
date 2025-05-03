
document.getElementById("start-button").onclick = () => {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
};

document.getElementById("restart-button").onclick = () => {
    location.reload();
};
