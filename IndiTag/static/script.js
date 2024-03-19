
function loadMode(mode) {
    var contentDiv = document.getElementById('content');
    contentDiv.innerHTML = ''; // Clear previous content

    if (mode === 1) {
        // Load Mode 1 content (Article input and display indicators)
        var counter = 0;
        var all_content = {}
        var articleFormHTML = `
            <form id="articleForm">
                <textarea id="testarticleInput" name="article" placeholder="Enter your article here..."></textarea>
                <input type="file" id="fileInput">
                <select id="exampleSelector">
                    <option value="default">Select Examples</option>
                    <option value="example1">Example 1</option>
                    <option value="example2">Example 2</option>
                    <option value="example3">Example 3</option>
                </select>
                <br>
                <input type="password" id="keyInput" name="keyInput"  placeholder="Enter your OpenAI key here...">
                <br>
                <button id="submitButton" type="submit">Submit</button>
            </form>
            
            <div id="waitPart" style="display: none;">Processing your article, please wait...</div>
            <br>
            <div id="resultPart"></div>
            
            <div id="annotationPart" style="display: none;">
                <div id="comInputPart">
                    <label for="comInput">Input your annotation comments here:</label>
                    <br>
                    <input type="text" id="comInput" name="comInput"><br>
                </div>
                
                <br>
                <button id="saveButton">Save as JSON</button>
                <button id="addNewButton">Add New One</button>
            </div>
            
        `;
        contentDiv.innerHTML = articleFormHTML;
        document.getElementById('exampleSelector').addEventListener("change", updateTextbox);

        document.getElementById('fileInput').addEventListener('change', function(event) {
            var file = event.target.files[0]; // Get the selected file
            var textarea = document.getElementById('testarticleInput');
            // Create a FileReader object
            var reader = new FileReader();
            // Define an event listener for when the file is loaded
            reader.onload = function(e) {
                // Set the content of the textarea to the contents of the file
                textarea.value = e.target.result;
            };
            // Read the contents of the selected file as text
            reader.readAsText(file);
        });

        // Attach event listener to the save button, and save the file of annotation
        document.getElementById('saveButton').addEventListener('click', function() {
            var anno_com = document.getElementById('comInput').value;
            all_content[counter]['comments'] = anno_com
            var filename = 'myindivec.json';
            saveAsJSON(all_content, filename);
        });
        // Add click event listener to the "Add New One" button
        document.getElementById('addNewButton').addEventListener('click', function() {
            // Show the text input and submit button
            var anno_com = document.getElementById('comInput').value;
            all_content[counter]['comments'] = anno_com;
            var commentpart = document.createElement('p');
            commentpart.textContent = 'Comment:  ' + anno_com;
            document.getElementById('resultPart').appendChild(commentpart);
            document.getElementById('comInput').value = '';
            document.getElementById('testarticleInput').style.display = 'block';
            document.getElementById('keyInput').style.display = 'inline-block';
            document.getElementById('submitButton').style.display = 'inline-block';
            document.getElementById('exampleSelector').style.display = 'inline-block';
            document.getElementById('fileInput').style.display = 'inline-block';

            // Hide the save button and add new button
            document.getElementById('addNewButton').style.display = 'none';
            document.getElementById('waitPart').style.display = 'none';
            document.getElementById('comInputPart').style.display = 'none';

            // Clear the text input
            document.getElementById('testarticleInput').value = '';
        });


        // process the data by IndiTag
        document.getElementById('articleForm').addEventListener('submit', function(event) {
            event.preventDefault();
            var inputKey = document.getElementById('keyInput').value;
            if (inputKey.trim() === '') {
                alert('Empty input');
            }else{
                document.getElementById('waitPart').style.display = 'block';
                var formData = new FormData(this);
                counter++;
                fetch('/process', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('waitPart').style.display = 'none';
                    displayDepInd(data.processed_text, data.descriptor_indicator, data.processed_data, data.descriptor_mapping)
                    all_content[counter] = {}
                    all_content[counter]['article'] = data.processed_text
                    all_content[counter]['indivec'] = data.descriptor_indicator
                    all_content[counter]['mapping'] = data.descriptor_mapping

                    // Hide the text input and submit button
                    document.getElementById('testarticleInput').style.display = 'none';
                    document.getElementById('keyInput').style.display = 'none';
                    document.getElementById('submitButton').style.display = 'none';
                    document.getElementById('exampleSelector').style.display = 'none';
                    document.getElementById('fileInput').style.display = 'none';

                    // Show the save button and add new button
                    document.getElementById('annotationPart').style.display = 'inline-block';
                    document.getElementById('addNewButton').style.display = 'inline-block';
                    document.getElementById('comInputPart').style.display = 'inline-block';

                })
                .catch(error => console.error('Error:', error));
            }
        });
    } else if (mode === 2) {
        // Load Mode 2 content (Prepared examples)
        fetch('/examples')
        .then(response => response.json())
        .then(example_dict => {
            var example_html = `
                <h1>Prepared Examples</h1>
                <div id="examplePart"></div>
            `;
            contentDiv.innerHTML = example_html;
            example_displayDepInd(example_dict);
        })
        .catch(error => console.error('Error:', error));
    } else if (mode === 3) {
        // contentDiv.innerHTML = 'Mode 3 content goes here...';
        var mappingHTML = `
        <form id="mappingForm">
            <textarea id="mappingarticleInput" name="article" placeholder="Enter your article here..."></textarea>
            <input type="text" id="depInput" name="depInput" placeholder="Enter your descriptor here..."><br>
            <input type="password" id="mapkeyInput" name="mapkeyInput" placeholder="Enter your OpenAI key here...">
            <br>
            <button id="mappingButton" type="submit">Submit</button>
            <div id="depDisplay"></div>
            <div id="mappedarticleDisplay"></div>
        </form>
        `;
        contentDiv.innerHTML = mappingHTML;
        document.getElementById('mappingForm').addEventListener('submit', function(event) {
            event.preventDefault();

            var formData = new FormData(this);
            fetch('/mapping', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    var dep = document.getElementById('depInput').value;
                    document.getElementById('depDisplay').innerHTML = "<p>Descriptor:  " + dep + "</p>";
                    document.getElementById('mappedarticleDisplay').innerHTML = "<p>" + data.mapped_article + "</p>";
                })
                .catch(error => console.error('Error:', error));
        });

    }else if (mode === 0) {
        // Load Mode 0 index
        fetch('/introduction')
        .then(response => response.text())
        .then(html => {
            contentDiv.innerHTML = html;
        })
        .catch(error => console.error('Error:', error));
    }
}



// Function to display the mapping data
function toggleValues(element,descriptor_mapping,articleContenter){
    var valuesDiv = element.nextElementSibling;
    valuesDiv.style.display = valuesDiv.style.display === "none" ? "block" : "none";
    if(valuesDiv.style.display === "block"){
        var oritext = articleContenter.textContent;
        var newText = oritext;
        for (var j = 0; j < descriptor_mapping.length; j++) {
            var phraseRegExp = new RegExp('(' + descriptor_mapping[j] + ')', 'gi');
            newText = newText.replace(phraseRegExp, '<map_underline>'+descriptor_mapping[j]+'</map_underline>');
        }
        articleContenter.innerHTML = newText;
    }
}


// Function to display the descriptors and indicators
function displayDepInd(processed_text, descriptor_indicator,processed_scores,descriptor_mapping) {
    const dictionaryDiv = document.getElementById("resultPart");
    var eachcaseContainer = document.createElement('div');
    eachcaseContainer.className = 'framed-div';

    var articleContainer = document.createElement('div');
    var articlelabel = document.createElement('p');
    articlelabel.textContent = 'Article:';

    // Create the article content paragraph
    var articleContent = document.createElement('p');
    articleContent.className = 'articleContent';
    articleContent.textContent = processed_text;

    // Create the toggle button
    var toggleButton = document.createElement('Button');
    toggleButton.className = 'toggleButton';
    toggleButton.textContent = 'Show More';

    // Append the article content and toggle button to the article container
    articleContainer.appendChild(articlelabel);
    articleContainer.appendChild(articleContent);
    articleContainer.appendChild(toggleButton);

    eachcaseContainer.appendChild(articleContainer);

    toggleButton.addEventListener('click', function() {
        if (articleContent.style.maxHeight) {
            articleContent.style.maxHeight = null;
            toggleButton.textContent = 'Show More';
        } else {
            articleContent.style.maxHeight = articleContent.scrollHeight + 'px';
            toggleButton.textContent = 'Show Less';
        }
    });


    for (const key in descriptor_indicator) {
        if (descriptor_indicator.hasOwnProperty(key)) {
            const keyDiv = document.createElement("div");
            keyDiv.className = "dict-key";
            keyDiv.textContent = ' -Descriptor- ' + key;
             // Set the background of the bar using linear gradient
            var keybar = document.createElement('div');
            keybar.classList.add('bar');
            var rightPercentage = processed_scores[key][0]; // Percentage of blue segment
            var leftPercentage = processed_scores[key][1]; // Percentage of red segment
            var centerPercentage = processed_scores[key][2]; // Percentage of grey segment
            keybar.style.background = 'linear-gradient(to right, red 0%, red ' + leftPercentage + '%, grey ' + leftPercentage + '%, grey ' + (leftPercentage + centerPercentage) + '%, blue ' + (leftPercentage + centerPercentage) + '%, blue 100%)';

            keyDiv.appendChild(keybar);

            keyDiv.addEventListener("click", function() {
                var mapping_content = descriptor_mapping[key]
                toggleValues(keyDiv,mapping_content,articleContent);

            });

            const valuesDiv = document.createElement("div");
            valuesDiv.className = "dict-values";

            valuesDiv.innerHTML = '';
            descriptor_indicator[key].forEach(item => {
                var indicator = item[0];
                var score = item[1];
                var labelid = item[2];

                var barContainer = document.createElement('div');
                barContainer.classList.add('bar-container');

                var indicatorText = document.createElement('span');
                indicatorText.textContent = indicator;
                indicatorText.classList.add('indicator-text');
                barContainer.appendChild(indicatorText);

                var bar = document.createElement('div');
                bar.classList.add('bar');
                bar.style.width = 100+ '%';
                var scorePercentage = String(Math.abs(score) * 100);
                if (labelid > 0) {
                    bar.style.background = 'linear-gradient(to right, red 0%, red ' + scorePercentage + '%, white ' + scorePercentage + '%, white 100%)';
                } else if (labelid < 0) {
                    bar.style.background = 'linear-gradient(to right, blue 0%, blue ' + scorePercentage + '%, white ' + scorePercentage + '%, white 100%)';
                } else {
                    bar.style.background = 'linear-gradient(to right, grey 0%, grey ' + scorePercentage + '%, white ' + scorePercentage + '%, white 100%)';
                }

                barContainer.appendChild(bar);
                valuesDiv.appendChild(barContainer);
            });


            eachcaseContainer.appendChild(keyDiv);
            eachcaseContainer.appendChild(valuesDiv);

        }
    }
    dictionaryDiv.appendChild(eachcaseContainer);
}


// Function to display the example
function example_displayDepInd(example_dict) {
    const exampleDiv = document.getElementById("examplePart");

    var processed_text = example_dict['example1']['processed_text'];
    var descriptor_indicator = example_dict['example1']['descriptor_indicator'];
    var processed_scores = example_dict['example1']['processed_data'];
    var descriptor_mapping = example_dict['example1']['descriptor_mapping'];

    var articleContainer = document.createElement('div');

    var articlelabel = document.createElement('p');
    articlelabel.textContent = 'Article:';

    var articleContent = document.createElement('p');
    articleContent.className = 'articleContent';
    articleContent.textContent = processed_text;

    var toggleButton = document.createElement('Button');
    toggleButton.className = 'toggleButton';
    toggleButton.textContent = 'Show More';

    articleContainer.appendChild(articlelabel);
    articleContainer.appendChild(articleContent);
    articleContainer.appendChild(toggleButton);

    exampleDiv.appendChild(articleContainer);

    toggleButton.addEventListener('click', function() {
        if (articleContent.style.maxHeight) {
            articleContent.style.maxHeight = null;
            toggleButton.textContent = 'Show More';
        } else {
            articleContent.style.maxHeight = articleContent.scrollHeight + 'px';
            // toggleButton.style.display = 'none';
            toggleButton.textContent = 'Show Less';
        }
    });

    for (const key in descriptor_indicator) {
        if (descriptor_indicator.hasOwnProperty(key)) {
            const keyDiv = document.createElement("div");
            keyDiv.className = "dict-key";
            keyDiv.textContent = ' -Descriptor- ' + key;
             // Set the background of the bar using linear gradient
            var keybar = document.createElement('div');
            keybar.classList.add('bar');
            var rightPercentage = processed_scores[key][0]*10; // Percentage of blue segment
            var leftPercentage = processed_scores[key][1]*10; // Percentage of red segment
            var centerPercentage = processed_scores[key][2]*10; // Percentage of gray segment
            keybar.style.background = 'linear-gradient(to right, red 0%, red ' + leftPercentage + '%, grey ' + leftPercentage + '%, grey ' + (leftPercentage + centerPercentage) + '%, blue ' + (leftPercentage + centerPercentage) + '%, blue 100%)';


            keyDiv.appendChild(keybar);

            keyDiv.addEventListener("click", function() {
                var mapping_content = descriptor_mapping[key]
                toggleValues(keyDiv,mapping_content,articleContainer);
            });

            const valuesDiv = document.createElement("div");
            valuesDiv.className = "dict-values";

            valuesDiv.innerHTML = '';
            descriptor_indicator[key].forEach(item => {
                var indicator = item[0];
                var score = item[1];
                var labelid = item[2];

                var barContainer = document.createElement('div');
                barContainer.classList.add('bar-container');

                var indicatorText = document.createElement('span');
                indicatorText.textContent = indicator;
                indicatorText.classList.add('indicator-text');
                barContainer.appendChild(indicatorText);

                var bar = document.createElement('div');
                bar.classList.add('bar');
                bar.style.width = 100+ '%';
                var scorePercentage = String(Math.abs(score) * 100);
                if (labelid > 0) {
                    bar.style.background = 'linear-gradient(to right, red 0%, red ' + scorePercentage + '%, white ' + scorePercentage + '%, white 100%)';
                } else if (labelid < 0) {
                    bar.style.background = 'linear-gradient(to right, blue 0%, blue ' + scorePercentage + '%, white ' + scorePercentage + '%, white 100%)';
                } else {
                    bar.style.background = 'linear-gradient(to right, grey 0%, grey ' + scorePercentage + '%, white ' + scorePercentage + '%, white 100%)';
                }

                barContainer.appendChild(bar);
                valuesDiv.appendChild(barContainer);
            });

            exampleDiv.appendChild(keyDiv);
            exampleDiv.appendChild(valuesDiv);
        }
    }
}





// Function to update the textbox when an example is selected
function updateTextbox() {
    const exampleSelector = document.getElementById("exampleSelector");

    // Define examples
    const examples = {
        "default": "",
        "example1": "A Joe Biden presidency could reset ties with top US trade partner Mexico that have suffered since Donald Trump made his first White House bid tarring Mexican migrants as rapists and gun runners and vowing to keep them out with a border wall",
        "example2": "This is example 2.",
        "example3": "This is example 3."
    };

    const selectedExample = exampleSelector.value;
    const myTextArea = document.querySelector("#testarticleInput");
    myTextArea.innerText = examples[selectedExample];
}


// Function to save content as a JSON file
function saveAsJSON(content, filename) {

    // alert("save")
    var jsonContent = JSON.stringify(content, null, 2); // Indentation with 2 spaces for readability

    // Create a Blob containing the JSON data
    var blob = new Blob([jsonContent], { type: 'application/json' });

    // Create a temporary URL for the Blob
    var url = URL.createObjectURL(blob);

    // Create a temporary link element
    var link = document.createElement('a');
    link.href = url;
    link.download = filename; // Set the filename for the downloaded file

    // Append the link to the document body and click it programmatically
    document.body.appendChild(link);
    link.click();

    // Cleanup: Remove the temporary link and URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}




