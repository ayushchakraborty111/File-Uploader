const { parentPort, workerData } = require("worker_threads");
const path = require("path");
const fs = require("fs");

const data = workerData.body;

try {
  const result = bodyParsed(data);
  parentPort.postMessage(result);
} catch (err) {
  parentPort.postMessage(`Error with statusCode: 400\n${err}`);
}

function bodyParsed(body) {
    var fileName = [];
    var keyName = [];
  
    if (body.indexOf("form-data") > -1) {
      var idxDash = body.indexOf("-");
      var idxCD = body.indexOf("Content-Disposition");
      var str = body.substring(idxDash, idxCD);
      var arr = [];
      arr = body.split(str);
      arr = arr.slice(1, arr.length);
  
      let data = [];
      var requiredStr = str + "--";
  
      var dashedIdx = arr[arr.length - 1].indexOf(requiredStr);
      arr[arr.length - 1] = arr[arr.length - 1].slice(0, dashedIdx);
  
      for (let i = 0; i < arr.length; i++) {
        var replaceChar = arr[i].replace(/\r\n/, "red");
        arr[i] = replaceChar;
        var replacedChar = arr[i].replace(/;/, "blue");
        arr[i] = replacedChar;
      }
  
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].indexOf("Content-Type") > -1) {
          var idx = arr[i].indexOf("\r\n");
          var slicedArr = arr[i].slice(idx, arr[i].length);
          var slicedArrIdx = slicedArr.indexOf("\r\n");
          data.push(slicedArr.slice(slicedArrIdx + 4, arr[i].length));
          var fileIdx = arr[i].indexOf("filename");
          var replacedIdx = arr[i].indexOf("red");
          fileName.push(arr[i].slice(fileIdx + 10, replacedIdx - 1));
          var nameIdx = arr[i].indexOf("name");
          var semiColonIdx = arr[i].indexOf(";");
          keyName.push(arr[i].slice(nameIdx + 6, semiColonIdx - 1));
        } else {
          var replacedIdx = arr[i].indexOf("red");
          arr[i] = arr[i].replace(/\r\n/, "");
          var spaceIdx = arr[i].indexOf("\r\n");
          data.push(arr[i].slice(replacedIdx + 3, spaceIdx));
          var nameIdx = arr[i].indexOf("name");
          keyName.push(arr[i].slice(nameIdx + 6, replacedIdx - 1));
          fileName.push(data[i]);
        }
      }
      createFile(data, fileName, keyName);
      var arrOfObj = [];
      for (let i = 0; i < fileName.length; i++) {
        arrOfObj.push({
          key: keyName[i],
          value: fileName[i],
        });
      }
    }
    return arrOfObj;
  }
  
  function createFile(data, fileName, keyName) {
    var src = path.join(__dirname, "src");
    fs.mkdir(src, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
      } else {
        for (let i = 0; i < data.length; i++) {
          if (data[i].indexOf(".") > -1) {
            fs.writeFile(
              `${src}/${fileName[i]}`,
              Buffer.from(data[i], "binary"),
              { encoding: "binary" },
              (err) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          } else {
            fs.writeFile(
              `${src}/${keyName[i]}.json`,
              `{"${keyName[i]}":"${fileName[i]}"}`,
              (err) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          }
        }
      }
    });
  }
