//load side menu
async function loadSideMenu() {
    //load json file
    return await fetch('../json/menu.json').them((response) => {
        return response.json();
    })
    .catch((error) => {
        console.error(error);
    });
}
//show side menu
function showSideMenu() {
    //parent div
    var sideMenu = document.getElementById('side-menu');
    //load json
    loadSideMenu().then((menu) => {
        //clear side menu
        sideMenu.innerHTML = '';
        //add items to side menu
        loadSideMenu().then((response) => {
            console.log(response);
        });
    });
}
//draw menu option