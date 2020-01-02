var tip = document.getElementById('tip');
var flag = false;
function toggle(obj) {
    if (flag == false) {
        tip.style.display = 'block';
    } else {
        tip.style.display = 'none';
    }
}