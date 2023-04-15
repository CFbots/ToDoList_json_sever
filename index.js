function myFetch(url, options = {}) {
    return new Promise((res, rej) => {
        let xhr = new XMLHttpRequest();
        xhr.open(options.method || "GET", url);
        xhr.responseType = "json";
        for (let headerName in options.headers) {
            xhr.setRequestHeader(headerName, options.headers[headerName]);
        }
        xhr.onload = () => {
            res(xhr.response);
        };
        xhr.onerror = () => {
            rej(new Error("myFetch failed"));
        };
        xhr.send(options.body);
    });
}

const APIs = (() => {
    const createTodo = (newTodo) => {
        return myFetch("http://localhost:3000/todos", {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const deleteTodo = (id) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return myFetch("http://localhost:3000/todos");
    };

    const updateTodo = (id, todoItem) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "PATCH",
            body: JSON.stringify(todoItem),
            headers: { "Content-Type": "application/json" },
        });
    };

    return { createTodo, deleteTodo, getTodos, updateTodo };
})();

const Model = (() => {
    class State {
        #todos; //private field
        #onChange; //function, will be called when setter function todos is called
        constructor() {
            this.#todos = [];
        }
        get todos() {
            return this.#todos;
        }
        set todos(newTodos) {
            // reassign value
            console.log("setter function");
            this.#todos = newTodos;
            this.#onChange?.(); // rendering
        }

        subscribe(callback) {
            //subscribe to the change of the state todos
            this.#onChange = callback;
        }
    }
    const { getTodos, createTodo, deleteTodo, updateTodo } = APIs;
    return {
        State,
        getTodos,
        createTodo,
        deleteTodo,
        updateTodo,
    };
})();

const View = (() => {
    const todolistpendingEl = document.querySelector(".todolist_pending");
    const todolistcompletedEl = document.querySelector(".todolist_completed");
    const submitBtnEl = document.querySelector(".submit-btn");
    const editBtnEl = document.querySelector(".edit-btn");
    const inputEl = document.querySelector(".input");

    const renderTodos = (todos) => {
        let todosPendingTemplate = "";
        let todosCompletedTemplate = "";
        const todopending = todos.filter((todo) => !todo.completed);
        const todocompleted = todos.filter((todo) => todo.completed);
        //pending list
        todopending.forEach((todo) => {
            const liTemplate = `<li><span id="${todo.id}">${todo.content}</span><button class="edit-btn" id="edit-btn_${todo.id}">edit</button><button class="delete-btn" id="delete-btn/${todo.id}">delete</button><button class="move-btn" id="move-btn_${todo.id}">=></button></li>`;
            todosPendingTemplate += liTemplate;
        });
        if (todopending.length === 0) {
            todosPendingTemplate = "<h4>no task to display!</h4>";
        }
        todolistpendingEl.innerHTML = todosPendingTemplate;

        //completed list
        todocompleted.forEach((todo) => {
            const liTemplate = `<li><button class="move-btn" id="move-btn_${todo.id}"><=</button><span>${todo.content}</span><button class="edit-btn" id="edit-btn_${todo.id}">edit</button><button class="delete-btn" id="delete-btn/${todo.id}">delete</button></li>`;
            todosCompletedTemplate += liTemplate;
        });
        if (todocompleted.length === 0) {
            todosCompletedTemplate = "<h4>no task to display!</h4>";
        }
        todolistcompletedEl.innerHTML = todosCompletedTemplate;
    };

    const clearInput = () => {
        inputEl.value = "";
    };

    return { renderTodos, submitBtnEl, inputEl, editBtnEl, clearInput, todolistpendingEl, todolistcompletedEl };
})();

const Controller = ((view, model) => {
    const state = new model.State();
    const init = () => {
        model.getTodos().then((todos) => {
            todos.reverse();
            state.todos = todos;
        });
    };

    const handleSubmit = () => {
        view.submitBtnEl.addEventListener("click", (event) => {
            const inputValue = view.inputEl.value;
            model.createTodo({ content: inputValue, completed:false }).then((data) => {
                state.todos = [data, ...state.todos];
                view.clearInput();
            });
        });
    };

    const handleDelete = () => {
        view.todolistpendingEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id.split("/")[1];
                console.log("id:", id);
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        });

        view.todolistcompletedEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id.split("/")[1];
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        });
    };

    const handleMove = () => {
        view.todolistpendingEl.addEventListener("click", (event) => {
            if(event.target.className === "move-btn"){
                const move_id = event.target.id.split("_")[1];
                state.todos.map((todoitem) => {
                    if (+todoitem.id === +move_id) {
                        todoitem.completed = true;
                        model.updateTodo(move_id, todoitem).then(data => console.log("completed!", data));
                    }
                  });
            }
        })

        view.todolistcompletedEl.addEventListener("click", (event) => {
            if(event.target.className === "move-btn"){
                const move_id = event.target.id.split("_")[1];
                state.todos.map((todoitem) => {
                    console.log(todoitem, move_id)
                    if (+todoitem.id === +move_id) {
                        todoitem.completed = false;
                        model.updateTodo(move_id, todoitem).then(data => console.log("Uncomplete!", data));;
                    }
                  });
            }
        })
    };

    const handleEdit = () =>{
        view.todolistpendingEl.addEventListener("click", (event) =>{
            if(event.target.className === "edit-btn"){
                const editid = event.target.id.split("_")[1];
                const spanEl = event.target.parentElement.firstChild;
                spanEl.classList.add("editing_span");
                spanEl.contentEditable = true;
                spanEl.addEventListener("keyup", (event) => {
                    if(event.code === 'Enter'){
                        model.updateTodo(+editid, { content: spanEl.innerHTML }).then(() => {
                        spanEl.contentEditable = "false";
                        spanEl.classList.remove("editing_span");
                        });
                    }
                })
            }
        })

        view.todolistcompletedEl.addEventListener("click", (event) =>{
            if(event.target.className === "edit-btn"){
                const editid = event.target.id.split("_")[1];
                const spanEl = event.target.parentElement.children[1];
                spanEl.classList.add("editing_span");
                spanEl.contentEditable = true;
                spanEl.addEventListener("keyup", (event) => {
                    if(event.code === 'Enter'){
                        model.updateTodo(+editid, { content: spanEl.innerHTML }).then(() => {
                        spanEl.contentEditable = "false";
                        spanEl.classList.remove("editing_span");
                        });
                    }
                })
            }
        })
        
    }

    const bootstrap = () => {
        init();
        handleSubmit();
        handleDelete();
        handleMove();
        handleEdit();
        state.subscribe(() => {
            view.renderTodos(state.todos);
        });
    };
    return {
        bootstrap,
    };
})(View, Model); //ViewModel

Controller.bootstrap();
