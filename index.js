//console.log("hello world")

/* 
  client side
    template: static template
    logic(js): MVC(model, view, controller): used to server side technology, single page application
        model: prepare/manage data,
        view: manage view(DOM),
        controller: business logic, event bindind/handling

  server side
    json-server
    CRUD: create(post), read(get), update(put, patch), delete(delete)


*/

//read
/* fetch("http://localhost:3000/todos")
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
    }); */

const APIs = (() => {
    const createTodo = (newTodo) => {
        return fetch("http://localhost:3000/todos", {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const deleteTodo = (id) => {
        return fetch("http://localhost:3000/todos/" + id, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch("http://localhost:3000/todos").then((res) => res.json());
    };

    const updateTodo = (id, todoItem) => {
        return fetch("http://localhost:3000/todos/" + id, {
            method: "PATCH",
            body: JSON.stringify(todoItem),
            headers: { "Content-Type": "application/json" },
        });
    };

    return { createTodo, deleteTodo, getTodos, updateTodo };
})();

//IIFE
//todos
/* 
    hashMap: faster to search
    array: easier to iterate, has order


*/
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
/* 
    todos = [
        {
            id:1,
            content:"eat lunch"
        },
        {
            id:2,
            content:"eat breakfast"
        }
    ]

*/
const View = (() => {
    const todolistpendingEl = document.querySelector(".todolist_pending");
    const todolistcompletedEl = document.querySelector(".todolist_completed");
    const submitBtnEl = document.querySelector(".submit-btn");
    const inputEl = document.querySelector(".input");

    const renderTodos = (todos) => {
        let todosPendingTemplate = "";
        let todosCompletedTemplate = "";
        const todopending = todos.filter((todo) => !todo.completed);
        const todocompleted = todos.filter((todo) => todo.completed);
        //pending list
        todopending.forEach((todo) => {
            const liTemplate = `<li><span id="${todo.id}">${todo.content}</span><button class="edit-btn" id="edit-btn_${todo.id}">edit</button><button class="delete-btn" id="delete-btn/${todo.id}">delete</button><button class="move-btn" id="move-btn_${todo.id}">-></button></li>`;
            todosPendingTemplate += liTemplate;
        });
        if (todopending.length === 0) {
            todosPendingTemplate = "<h4>no task to display!</h4>";
        }
        todolistpendingEl.innerHTML = todosPendingTemplate;

        //completed list
        todocompleted.forEach((todo) => {
            const liTemplate = `<li><span>${todo.content}</span><button class="edit-btn" id="edit-btn_${todo.id}">edit</button><button class="delete-btn" id="delete-btn/${todo.id}">delete</button><button class="move-btn" id="move-btn_${todo.id}"><-</button></li>`;
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

    return { renderTodos, submitBtnEl, inputEl, clearInput, todolistpendingEl, todolistcompletedEl };
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
            /* 
                1. read the value from input
                2. post request
                3. update view
            */
            const inputValue = view.inputEl.value;
            model.createTodo({ content: inputValue, completed:false }).then((data) => {
                state.todos = [data, ...state.todos];
                view.clearInput();
            });
        });
    };

    const handleDelete = () => {
        //event bubbling
        /* 
            1. get id
            2. make delete request
            3. update view, remove
        */
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
                        model.updateTodo(move_id, todoitem);
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
                        model.updateTodo(move_id, todoitem);
                    }
                  });
            }
        })
    };

    const bootstrap = () => {
        init();
        handleSubmit();
        handleDelete();
        handleMove();
        state.subscribe(() => {
            view.renderTodos(state.todos);
        });
    };
    return {
        bootstrap,
    };
})(View, Model); //ViewModel

Controller.bootstrap();
