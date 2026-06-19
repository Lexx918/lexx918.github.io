/**
 *
 */
function Coloring(canvas, width, height, progressCallback)
{
    var canvas = canvas,
        width  = width,
        height = height
        progressCallback = progressCallback;

    var background = [255,255,255],
        border     = [  0,  0,  0],
        error      = 220
        imageData  = canvas.getImageData(0, 0, width, height).data;

    var init = false;

    /**
     * Extraction lines
     *
     * lines = [
     *   rowNum => [ [leftX, rightX, claster], [..], [..] ],
     *   rowNum => [ [leftX, rightX, claster], [..], [..] ],
     * ]
     */
    var lines = [];
    var getDot = function(x, y){
        var offset = (y*width + x) * 4;
        return [imageData[offset], imageData[offset + 1], imageData[offset + 2]];
    }
    var canFill = function(x, y){
        var dot = getDot(x, y);
        return ""+dot !== ""+border &&
            Math.abs(background[0] - dot[0]) <= error &&
            Math.abs(background[1] - dot[1]) <= error &&
            Math.abs(background[2] - dot[2]) <= error;
    }
    var row = 0;
    var extract = function(){
        lines[row] = [];
        var left = -1;
        for (var col = 0; col < width; col++) {
            if (canFill(col, row)) {
                if (left === -1) {
                    left = col;
                }
            } else {
                if (left !== -1) {
                    lines[row].push([left, col - 1, 0]);
                    left = -1;
                }
            }
        }
        if (left !== -1) {
            lines[row].push([left, width, 0]);
        }

        if (++row < height) {
            progressCallback((row*50)/height);
            setTimeout(extract, 0);
        } else {
            row = 0;
            clustering();
        }
    }
    setTimeout(extract, 0);

    // clustering
    var claster = 0;
    var child, childrenUp, childrenDown, children = [];
    var getChildren = function(left, right, row){
        if (row < 0 || row >= height) {
            return;
        }

        var arr = [];
        // http://www.codeproject.com/Articles/6017/QuickFill-An-efficient-flood-fill-algorithm
        for (var i = 0, len = lines[row].length; i < len; i++) {
            if (
                lines[row][i][2] === 0 &&
                (
                    lines[row][i][0] >= left && lines[row][i][0] <= right ||
                    lines[row][i][1] >= left && lines[row][i][1] <= right ||
                    lines[row][i][0] < left && lines[row][i][1] >= left ||
                    lines[row][i][1] > right && lines[row][i][0] <= right
                )
            ) {
                arr.push([row, i]);
                left = lines[row][i][1] + 2;
            }
        }
        return arr;
    }
    var clustering = function(){
        for (var i = 0, len = lines[row].length; i < len; i++) {
            if (lines[row][i][2] === 0) {
                claster++;

                children.push([row, i]);
                while (child = children.pop()) {
                    lines[child[0]][child[1]][2] = claster;

                    childrenUp   = getChildren(lines[child[0]][child[1]][0], lines[child[0]][child[1]][1], child[0] - 1);
                    childrenDown = getChildren(lines[child[0]][child[1]][0], lines[child[0]][child[1]][1], child[0] + 1);

                    if (childrenUp)   children = children.concat(childrenUp);
                    if (childrenDown) children = children.concat(childrenDown);
                }
            }
        }

        if (++row < height) {
            progressCallback(50 + (row*50)/height);
            setTimeout(clustering, 0);
        } else {
            init = true;
            console.log("init = true");
        }
    }

    this.fill = function(x, y, color){
        if (!init) {
            return;
        }

        var row = y,
            left = x;
        if (row < 0 || row >= height) {
            return;
        }

        for (var claster = i = 0, len = lines[row].length; i < len; i++) {
            if (lines[row][i][0] <= left && lines[row][i][1] >= left) {
                claster = lines[row][i][2];
                break;
            }
        }

        if (!claster) {
            return;
        }

        canvas.fillStyle = "rgb("+color+")";

        var fillRow = function(r){
            var found = false;
            for (var i = 0, len = lines[r].length; i < len; i++) {
                if (lines[r][i][2] === claster) {
                    found = true;
                    canvas.fillRect(lines[r][i][0], r, lines[r][i][1] - lines[r][i][0] + 1, 1);
                }
            }
            return found;
        }

        for (var r = row; r < height; r++) {
            if (!fillRow(r)) {
                break;
            }
        }
        if (row > 0) {
            for (var found, r = row - 1; r >= 0; r--) {
                if (!fillRow(r)) {
                    break;
                }
            }
        }
    }
}
