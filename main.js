// Global varibale
let postList;

// Elements
let divContent = document.getElementById("content");
let postView = document.getElementById("postView");

// Adds a random id to the end of a URL, to prevent caching
function appendRandomId(baseUrl) {
    let randomId = Math.random().toString().split(".")[1];
    return baseUrl + "?" + randomId;
}

// Strips all white space, #, -, *, _, +, ---, ___ and *** from the start and `, links, *, _, **, __ and ~~ throughout
function stripAll(string) {
    // Trim white space
    string = string.trim();

    // Regexp which selects all the characters that need to be deleted
    let regexpDelete = /^\s+|^[#]{1,}|^[-_*]{3,}|^[-+*]|[\*_]{1,2}(.+?)[\*_]{1,2}|~{2}(.+?)~{2}/gm;

    string = string.replace(regexpDelete, "$1$2");

    // Return string
    return string;
}

function getFile(url, callback) {
    // Prepare request
    let r = new XMLHttpRequest();

    // Prepare callbacks
    r.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this.responseText);
        }
    }

    // Adds a random number to prevent caching
    url = appendRandomId(url);

    // Send the request
    r.open("GET", url, true);
    r.send();
}

// Gets the md file for a particular post
function getPost(post, postId, callback) {
    // Get the post md
    getFile("posts/" + post.link, function(response) {
        // Save the md and pass everything to the callback
        postList[postId].md = response;
        callback(postId);
    });
}

// Function to create a DOM element in one line
function makeElement(type, id, classList, innerHTML) {
    // Create the element
    let element = document.createElement(type);
    // Any IDs that it has
    if (id) {
        element.id = id;
    }
    // Any classes that it has
    if (classList) {
        for (i in classList) {
            element.classList.add(classList[i]);
        }
    }
    // Add any innerHTML
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
}

// Turn markdown into html elements
function parseMarkdown(md) {
    // Final elements
    let finalElements = makeElement("div");

    // Split the file into lines
    md = md.split("\n");

    // Used for terminating paragraph tags. Anything other than another blank line will break it
    let isParagraph = false;

    for (i in md) {
        // Line by line work out elements
        let line = md[i];

        // <hr/>
        if (/^[-_*]{3}/g.test(line)) {
            isParagraph = false;
            finalElements.appendChild(makeElement("hr"));
        }

        // Ends the paragraph totally
        else if (line == "" && isParagraph) {
            isParagraph = false;
        }

        // Headings
        else if (/^#/g.test(line)) {
            isParagraph = false;
            // Determine the heading size
            let headingSize = line.split(" ")[0].length;
            headingSize > 6 ? headingSize = "h6": headingSize = "h" + headingSize;

            // Get rid of the symbols at the start
            line = line.replace(/^#+\s/g, "");

            // Make the heading
            let heading = makeElement(headingSize, undefined, undefined, line);

            // Append it
            finalElements.appendChild(heading);
        }

        // Paragraphs
        else {
            if (isParagraph) {
                // Continuing on from another paragraph. Only add a line break
                finalElements.lastChild.innerHTML += "<br/>" + line;
            } else {
                // New paragraph totally
                isParagraph = true;
                let paragraph = makeElement("p", undefined, undefined, line);
                finalElements.appendChild(paragraph);
            }
        }
    }

    return finalElements;
}

// Opens a window with the full post
function displayFullPost(postId) {
    // Hide the post list and show the post container
    divContent.style.display = "none";
    postView.style.display = "block";

    // Get the current post details
    let currentPost = postList[postId];

    // Make elements
    let postHeader = makeElement("div", "postHeader");
    let postHeading = makeElement("h1", "postHeading", undefined, currentPost.title);
    let postDate = makeElement("p", undefined, ["date"], currentPost.date);
    let postHr = makeElement("hr");

    // Append the elements
    postView.appendChild(postHeader);
    postHeader.appendChild(postHeading);
    postHeader.appendChild(postDate);
    postHeader.appendChild(postHr);

    // Do the markdown
    let parsedMd = parseMarkdown(currentPost.md);
    parsedMd.id = "postContent";

    postView.appendChild(parsedMd);
}

// Displays all the posts from the post list with a preview
function displayPostList() {
    // For each post
    for (postId in postList) {
        let currentPost = postList[postId];

        // Get the md for the post
        getPost(currentPost, postId, function(postId) {
            // Make the preview
            // Outer div
            let postPreview = makeElement("div", undefined, ["postPreview"]);
            // Add a meta tag with the post id
            postPreview.postId = postId;

            // Heading
            let heading = makeElement("h2", undefined, ["heading"], currentPost.title);
            postPreview.appendChild(heading);

            // Date
            let date = makeElement("p", undefined, ["date"], currentPost.date);
            postPreview.appendChild(date);

            // hr
            let hr = makeElement("hr");
            postPreview.appendChild(hr);

            // Preview
            let preview = makeElement("div", undefined, ["preview"]);

            // Preview items (only 3)
            // Break apart the md file for parsing line by line
            let splitMdFile = currentPost.md.split("\n");
            for (i=0; i < 3; i++) {
                // Line element
                let previewLine = makeElement("p", undefined, undefined, stripAll(splitMdFile[i]));

                // Append line to the parent div
                preview.appendChild(previewLine);
            }

            // Append the preview
            postPreview.appendChild(preview);

            // Add the event listener
            postPreview.onclick = function() {
                displayFullPost(this.postId);
            }

            // Append the post preview to the content div
            divContent.appendChild(postPreview);
        });
    }
}

// Sends request for the post list
function loadPostList() {
    getFile("posts/postList.txt", function(response) {
        postList = JSON.parse(response);
        displayPostList();
    });
}

// Close the post and go back to the post list
function closePost() {
    // Delete the children until one is left (the close button)
    while (postView.children.length != 1) {
        let lastElement = postView.lastElementChild
        postView.removeChild(lastElement);
    }

    // Hide the post view and go back to the list
    postView.style.display = "none";
    divContent.style.display = "block";
}

document.getElementById("closePost").onclick = function() {
    closePost();
}

loadPostList();
