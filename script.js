const outputArea = document.getElementById('output');
const sortAsc = document.getElementById('sort-asc');
const sortDesc = document.getElementById('sort-desc');
const inputField = document.getElementById('filter');
const FILTER_ERROR = 'Your search return no result.';

let sortType = undefined;

const fetchData = async () => {
    const response = await fetch('https://raw.githubusercontent.com/wrike/frontend-test/master/data.json');

    return await response.json();
};

const sortById = (node1, node2) => {
    if (node1.id === node2.id) return 0;

    return node1.id < node2.id ? -1 : 1;
};

const sortByTitle = (node1, node2) => { // TODO: combine 2 functions together
    if (node1.title === node2.title) return 0;
    if (sortType === 'asc') return node1.title < node2.title ? -1 : 1;

    return node1.title < node2.title ? 1 : -1;
    
};


const clickHandler = (element) => {
    const parent = element.parentElement;
    parent.classList.contains('closed') ? parent.classList.remove('closed') : parent.classList.add('closed');
};

const insertNodeInTree = (node, tree, path) => {
    const idToFind = path.pop();

    if (!path.length) {
        tree[idToFind].children[node.id] = {
            title: node.title,
            children: {},
            shouldBeShown: true
        };

        return;
    }

    insertNodeInTree(node, tree[idToFind].children, path);
};


const calculateNodePath = (nodeId, parents) => {
    // calculate path to root so we don't have to use DFS or BFS when searching for the node later
    const path = [];
    let currentNode = nodeId;

    while (currentNode !== -1) {
        currentNode = parents[currentNode];
        path.push(currentNode);
    }

    return path;
};

const buildTree = (data) => {
    const tree = {};
    const parents = {}; // keep track of parent ids
    const rootElem = data[0];

    tree[rootElem.id] = {
        title: rootElem.title,
        children: {},
        shouldBeShown: true
    };

    for (let i = 1; i < data.length; i++) {
        parents[data[i].id] = data[i].parentId;
    }

    for (let i = 1; i < data.length; i++) {
        const path = calculateNodePath(data[i].id, parents);
        insertNodeInTree(data[i], tree, path);
    }

    return tree;
};


const renderTree = (node, element) => {
    const childrenIds = Object.keys(node.children);
    const newElement = document.createElement('div');

    if (!node.shouldBeShown) {
        return; // do not render children if parent is hidden
    }

    element.appendChild(newElement);

    if (!childrenIds.length) {
        newElement.innerHTML = `<p>${node.title}</p>`;

        return; // if element has no children, don't attach onclick handler and don't add the class-name
    }
    newElement.innerHTML = `<p onclick="clickHandler(this)">${node.title}</p>`;

    let nodeChildren = [];
    let visibleChildren = 0;

    for (let i = 0; i < childrenIds.length; i++) {
        nodeChildren.push(node.children[childrenIds[i]]);
    };

    if (sortType) {
        nodeChildren.sort(sortByTitle);
    };

    nodeChildren.map(child => {
        if (child.shouldBeShown) visibleChildren++;
        renderTree(child, newElement);
    });

    // don't show the carrot icon if no children are visible (for example, when using filter)
    if (visibleChildren > 0) newElement.classList.add('has-children');

};

const sortTree = (tree, sortDirection) => {
    if (outputArea.innerHTML !== FILTER_ERROR) {
        // add this check so the error message doesn't get lost when we sort with already applied filter
        outputArea.innerHTML = '';
    }
    sortType = sortDirection;

    renderTree(tree[-1], outputArea)
};

const applyFilter = (filterValue, node) => {
    const childrenIds = Object.keys(node.children);
    let foundChildren = false;

    for (let i = 0; i < childrenIds.length; i++) {
        if (applyFilter(filterValue, node.children[childrenIds[i]])) {
            foundChildren = true;
        }
    }

    if (node.title.toLowerCase().indexOf(filterValue) !== -1 || foundChildren) {
        node.shouldBeShown = true;
        return true;
    };

    node.shouldBeShown = false;
    return false;
}

const filter = (tree, input) => {
    const filterValue = input.value.toLowerCase();
    applyFilter(filterValue, tree[-1]);
    outputArea.innerHTML = '';
    renderTree(tree[-1], outputArea);

    if (outputArea.innerHTML === '') outputArea.innerHTML = FILTER_ERROR;
}


const init = async () => {
    const data = await fetchData();
    data.sort(sortById);

    const tree = buildTree(data);

    sortAsc.addEventListener('click', sortTree.bind(null, tree, 'asc'));
    sortDesc.addEventListener('click', sortTree.bind(null, tree, 'desc'));
    inputField.addEventListener('input', filter.bind(null, tree, inputField));

    renderTree(tree[-1], outputArea);
};

init();