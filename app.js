// state
const State = (function() {
	const state = {
		tasks: [
			{
				id: 0,
				task: "Wake up"
			},
			{
				id: 1,
				task: "Breakfast"
			},
			{
				id: 2,
				task: "Eat"
			},
			{
				id: 3,
				task: "Clean"
			}
		],
		currentEditId: null,
		currentState: "Default"
	};

	function getTasks() {
		return state.tasks;
	}

	function getTasksCount() {
		return state.tasks.length;
	}

	function addTask(item, stateType) {
		if (!stateType) {
			state.tasks.push(item);
		} else {
			const taskIndex = state.tasks.findIndex(function(item) {
				return item.id == state.currentEditId;
			});

			state.tasks.splice(taskIndex, 1, item);
		}
	}

	function removeTask(id) {
		const taskIndex = state.tasks.findIndex(function(item) {
			return item.id == id;
		});

		state.tasks.splice(taskIndex, 1);

		return taskIndex;
	}

	function setCurrentEditId(id) {
		state.currentEditId = id;
	}

	function getCurrentEditId() {
		return state.currentEditId;
	}

	function setCurrentState(stateType) {
		return (state.currentState = stateType);
	}

	function getCurrentState() {
		return state.currentState;
	}

	return {
		setCurrentEditId: setCurrentEditId,
		getCurrentEditId: getCurrentEditId,
		setCurrentState: setCurrentState,
		getCurrentState: getCurrentState,
		getTasks: getTasks,
		getTasksCount: getTasksCount,
		addTask: addTask,
		removeTask: removeTask,
		logData: function() {
			console.log(state.tasks);
		}
	};
})();

const Task = (function() {
	function Task(id, task) {
		this.id = id;
		this.task = task;
	}

	const createTask = function(id, task) {
		return new Task(id, task);
	};

	return {
		createTask: createTask
	};
})();

const UICtrl = (function() {
	const UISelectors = {
		form: document.forms.todo,
		submitBtn: document.forms.todo.taskSubmit,
		inputTask: document.forms.todo.elements["task"],
		inputTaskLabel: document.querySelector(".label"),
		list: document.querySelector(".list")
	};

	const getSelectors = function() {
		return UISelectors;
	};

	const displayTask = function(item) {
		const markup = `
      ${item.task}
      <span class="list__item--close"><i class="fa fa-close"></i></span>
    `;

		const el = document.createElement("li");
		el.className = "list__item";
		el.dataset.id = `task-${item.id}`;
		el.title = "Правый клик для редактирования";
		el.innerHTML = markup;

		if (State.getCurrentState() === "Edit") {
			UISelectors.list
				.querySelector(`[data-id="task-${item.id}"]`)
				.replaceWith(el);
		} else {
			UISelectors.list.append(el);
		}
	};

	const removeTask = function(id) {
		const task = UISelectors.list.querySelector(`[data-id=task-${id}]`);

		task.remove();
	};

	const getInput = function() {
		const value = UISelectors.inputTask.value;
		return value;
	};

	const clearInput = function() {
		UISelectors.inputTask.value = "";
	};

	return {
		getSelectors: getSelectors,
		displayTask: displayTask,
		removeTask: removeTask,
		getInput: getInput,
		clearInput: clearInput
	};
})();

const Validation = (function() {
	const regExps = {
		inputTaskValidate: /\s*[\w\d]+/g,
		inputSpaces: /^\s+|\s+$/g
	};

	const validateTaskInput = function(value) {
		if (regExps.inputTaskValidate.test(value)) return true;

		return false;
	};

	const removeSpaces = function(value) {
		return value.replace(regExps.inputSpaces, "");
	};

	return {
		validateTaskInput: validateTaskInput,
		removeSpaces: removeSpaces
	};
})();

const App = (function(UICtrl, Task, State, Validation) {
	const UISelectors = UICtrl.getSelectors();

	function setupEventListeners() {
		document.addEventListener("DOMContentLoaded", function(e) {
			UICtrl.clearInput();
			UISelectors.inputTask.focus();
		});

		UISelectors.inputTask.addEventListener("focus", inputTaskFocusHandler);
		UISelectors.inputTask.addEventListener("blur", inputTaskBlurHandler);

		UISelectors.submitBtn.addEventListener("click", formSubmitHandler);

		UISelectors.list.addEventListener("click", removeListItem);

		UISelectors.list.addEventListener("contextmenu", function(e) {
			e.preventDefault();
		});
		UISelectors.list.addEventListener("mousedown", editListItem);
	}

	function inputTaskFocusHandler() {
		UISelectors.inputTaskLabel.classList.add("active");
	}

	function inputTaskBlurHandler() {
		const input = UICtrl.getInput();
		if (input) {
			return;
		} else {
			UISelectors.inputTaskLabel.classList.remove("active");
		}
	}

	function formSubmitHandler(e) {
		e.preventDefault();

		const currentState = State.getCurrentState();

		let id = null,
			type = null,
			task = null,
			inputValue = UICtrl.getInput();

		if (Validation.validateTaskInput(inputValue)) {
			inputValue = Validation.removeSpaces(inputValue);

			console.log(inputValue);

			const tasksCount = State.getTasksCount();
			const tasks = State.getTasks();

			if (!tasksCount) {
				id = 0;
			} else {
				id = tasks[tasksCount - 1].id + 1;
			}

			if (currentState === "Edit") {
				id = State.getCurrentEditId();

				type = "edit";
			}

			task = Task.createTask(id, inputValue);

			State.addTask(task, type);

			UICtrl.displayTask(task);
		} else {
			console.log("Wrong input value");
		}

		if (currentState === "Edit") {
			UISelectors.submitBtn.textContent = "Submit";
			UISelectors.submitBtn.classList.remove("button--edit");

			UISelectors.list.addEventListener("click", removeListItem);

			State.setCurrentState("Default");
			State.setCurrentEditId(null);
		}

		UICtrl.clearInput();
		UISelectors.inputTask.blur();
		UISelectors.inputTaskLabel.classList.remove("active");
	}

	function removeListItem(e) {
		const target = e.target;

		if (!target.closest(".list__item--close")) return;

		const listItem = target.closest(".list__item");

		const listItemId = listItem.dataset.id.split("-")[1];

		State.removeTask(listItemId);

		UICtrl.removeTask(listItemId);
	}

	function editListItem(e) {
		e.preventDefault();

		const listItem = e.target.closest(".list__item");

		if (e.button !== 2 || e.which !== 3 || !listItem) return;

		State.setCurrentState("Edit");

		State.setCurrentEditId(+listItem.dataset.id.split("-")[1]);

		UISelectors.form.scrollIntoView();

		UISelectors.list.removeEventListener("click", removeListItem);

		UISelectors.inputTask.focus();

		UISelectors.inputTask.value = Validation.removeSpaces(listItem.textContent);

		UISelectors.submitBtn.textContent = "Save edit";
		UISelectors.submitBtn.classList.add("button--edit");
	}

	return {
		init: function() {
			const tasks = State.getTasks();

			tasks.forEach(function(item) {
				UICtrl.displayTask(item);
			});

			setupEventListeners();
		}
	};
})(UICtrl, Task, State, Validation);

// init
App.init();
