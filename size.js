const ipcRenderer = require('electron').ipcRenderer;

const okButton = document.getElementById('okButton');
const cancelButton = document.getElementById('cancelButton');
const size = document.getElementById('size');

ipcRenderer.on('reset', (event, data) => {
    size.value = '';
})

okButton.addEventListener('click', function() {
    size.value = size.value.toUpperCase();
    if (size.value.startsWith('UK ') || size.value.startsWith('US ')) {
        let sizeFloat = parseFloat(size.value.substr(3));
        console.log(size.value.substr(0, 3));
        // Check to make sure its a valid size
        console.log(sizeFloat / 0.5);
        console.log(Math.floor(sizeFloat / 0.5));
        if(sizeFloat / 0.5 == Math.floor(sizeFloat / 0.5)) {
            ipcRenderer.send('sizeResponse', {
                selected: true,
                size: size.value
            });
        }
        else
            flash(size, 'red');
    }
    else
        flash(size, 'red');
});

cancelButton.addEventListener('click', function() {
    ipcRenderer.send('sizeResponse', {
        selected: false,
        size: ''
    });
})

function flash(element, color) {
    let norm = element.style.background
    element.style.background = color;
    setTimeout(function() {
            element.style.background = norm;
    }, 250)
    setTimeout(function() {
        element.style.background = color;
    }, 500)
    setTimeout(function() {
        element.style.background = norm;
    }, 750)
}