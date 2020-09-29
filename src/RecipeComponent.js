import React, { Component, Fragment } from 'react';
import {
  RIEInput,
 RIESelect,
} from 'riek';
import { find, propEq, findIndex, update, remove } from 'ramda';
import ComponentIngredient from './ComponentIngredient.js';

const traverse = require('traverse');
const shortid = require('shortid');
const fetch = require('node-fetch');

const domain = 'http://8559a69bad94.ngrok.io';

class RecipeComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      componentId: props.id,
      nutrition: { ...props.nutrition },
      amount: props.amount,
      ingredients: this.props.ingredients.map((i) => ({
        id: i._id,
        name: i.ingredient.name,
        nutrition: i.nutrition, //nutrition is already calculated for this amount
        amount: i.amount,
        ingredient: i.ingredient,
      })),
      select: {},
      addIngredient: {
        _id: `placeholder-${shortid.generate()}`,
        text: 'Add an ingredient',
        amount: 0,
      },
    };

    for (let i = 0; i < this.props.ingredients.length; i++) {
      const ing = this.props.ingredients[i];
      this.state.select[`${ing._id}`] = {
        id: ing.ingredient._id,
        text: ing.ingredient.name,
      };
    }
  }

  getOptions = () => {
    return Object.values(this.props.allIngredients)
      .flat()
      .map((i) => ({
        id: i._id,
        text: i.name,
      }));
  };

  getCategoryOptions = (ing) =>
    this.props.allIngredients[ing.ingredient.category].map((i) => ({
      id: i._id,
      text: i.name,
    }));

  calculateIngredientNutritionForAmount(ingredient, amount) {
    const { energy, fat, carbs, protein, serving } = ingredient.ingredient;

    const nutritionForAmount = {
      energy: (energy / serving) * amount,
      fat: (fat / serving) * amount,
      carbs: (carbs / serving) * amount,
      protein: (protein / serving) * amount,
    };

    return nutritionForAmount;
  }

  calculateComponentNutrition(ingredients) {
    const nutrition = ingredients
      .map((ing) => ({
        ...ing.nutrition,
      }))
      .reduce((a, cv) => ({
        energy: a.energy + cv.energy,
        fat: a.fat + cv.fat,
        carbs: a.carbs + cv.carbs,
        protein: a.protein + cv.protein,
      }));

    return nutrition;
  }

  calculateIngredientPriceForAmount(ingredient) {
    const { price, packageSize } = ingredient.ingredient;
    const pfa = (price / packageSize) * ingredient.amount;
    return pfa ? Number(pfa).toFixed(2) : 0;
  }

  calculateComponentCost(ingredients) {

    //for each of the ingredients calculate
    console.log('calculateComponentCost');
    console.log(JSON.stringify(ingredients));
    const cost = ingredients
      .map((ing) => (
        this.calculateIngredientPriceForAmount(ing)
      ))
      .reduce((a, cv) => (
        Number(a) + Number(cv)
      ));
    console.log(cost);
    return Number(cost).toFixed(2);
  }

  setStateOnAmountChange = (patch) => {
    const updateState = { ...this.state };

    const value = Object.values(patch)[0];
    const path = Object.keys(patch)[0].split(/[[\].]+/);

    const ingredient = traverse(updateState).get(path.slice(0, 2));

    const nutrition = this.calculateIngredientNutritionForAmount(
      ingredient,
      value
    );

    traverse(updateState).set(path.slice(0, 2), {
      ...ingredient,
      nutrition: nutrition,
      amount: value,
    });

    const compNutrition = this.calculateComponentNutrition(
      this.state.ingredients
    );

    updateState.nutrition = { ...compNutrition };

    this.setState(updateState);
  };

  setStateOnIngredientChange = (patch) => {
    let updateState = { ...this.state };

    const value = Object.values(patch)[0];
    const path = Object.keys(patch)[0].split(/[[\].]+/);

    traverse(updateState).set(path.slice(0, 2), {
      ...value,
    });

    // find ingredient in allIngredients and replace component ingredient with it
    const chosenIngId = value.id;
    // path[1] is the id of the ingredient to be replaced in this.state.ingredients
    const replaceIngId = path[1];
    // it's the raw ingredient, it does not have nutrition per amount calculated
    const chosenIngredient = find(propEq('_id', chosenIngId))(
      Object.values(this.props.allIngredients).flat()
    );
    const replaceIngredient = find(propEq('id', replaceIngId))(
      Object.values(this.state.ingredients).flat()
    );

    let updateIngredient = {
      ...replaceIngredient,
      name: chosenIngredient.name,
      ingredient: { ...chosenIngredient },
    };

    updateIngredient.nutrition = this.calculateIngredientNutritionForAmount(
      updateIngredient,
      replaceIngredient.amount
    );

    updateState.ingredients = update(
      findIndex(propEq('id', replaceIngredient.id))(updateState.ingredients),
      updateIngredient,
      updateState.ingredients
    );

    const compNutrition = this.calculateComponentNutrition(
      updateState.ingredients
    );

    updateState.nutrition = { ...compNutrition };

    this.setState(updateState);
  };

  setStateOnIngredientRemoved = (ingId) => {
    // remove ingId from state.ingredients
    // recalculate component nutrition

    const updateState = { ...this.state };
    // Removes the sub-list of list starting at index start and containing count elements
    // R.remove(2, 3, [1,2,3,4,5,6,7,8]); //=> [1,2,6,7,8]
    updateState.ingredients = remove(
      findIndex(propEq('id', ingId))(updateState.ingredients),
      1,
      updateState.ingredients
    );

    const compNutrition = this.calculateComponentNutrition(
      updateState.ingredients
    );

    updateState.nutrition = { ...compNutrition };

    this.setState(updateState);
  };

  setStateOnIngredientAdd = (patch) => {
    const ingredient = find(propEq('_id', patch.addIngredient.id))(
      Object.values(this.props.allIngredients).flat()
    );

    const tempId = `temp-${shortid.generate()}`;
    const addIngredient = {
      id: tempId,
      name: ingredient.name,
      ingredient: { ...ingredient },
      amount: 0,
      nutrition: {
        energy: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
      },
    };
    const updateState = { ...this.state };

    updateState.ingredients.push(addIngredient);
    updateState.select[addIngredient.id] = {
      id: addIngredient.id,
      text: addIngredient.name,
    };

    this.setState(updateState);
  };

  saveComponent = async () => {
    const payload = JSON.stringify(this.state.ingredients);

    const response = await fetch(
      `${domain}/component/${this.state.componentId}`,
      {
        method: 'PUT',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // TODO: let the user know the outcome of this operation
  };

  renderIngredients = () => {
    let ings = [];
    ings = this.state.ingredients.map((ing, index) => {
      return (
        <tr key={ing.id} className="table-warning">
          <td>
            <RIESelect
              value={this.state.select[`${ing.id}`]}
              // className={this.state.highlight ? "editable" : ""}
              className="form-control"
              options={this.getCategoryOptions(ing)}
              change={this.setStateOnIngredientChange}
              classLoading="loading"
              propName={`select[${ing.id}]`}
              //   isDisabled={this.state.isDisabled}
            />
          </td>
          <td>{Number(ing.nutrition.carbs).toFixed(2)}</td>
          <td>{Number(ing.nutrition.energy).toFixed(2)}</td>
          <td>{Number(ing.nutrition.fat).toFixed(2)}</td>
          <td>{Number(ing.nutrition.protein).toFixed(2)}</td>
          <td>
            <RIEInput
              value={ing.amount}
              change={this.setStateOnAmountChange}
              propName={`ingredients[${index}].amount`}
              //   className={this.state.highlight ? 'editable' : ''}
              className="form-control"
              classLoading="loading"
              classInvalid="invalid"
              //   isDisabled={this.state.isDisabled}
            />
          </td>
          <td>{this.calculateIngredientPriceForAmount(ing)}</td>
          <td>
            <button
              type="button"
              class="btn"
              onClick={this.setStateOnIngredientRemoved.bind(this, ing.id)}
            >
              <svg
                width="2em"
                height="2em"
                viewBox="0 0 16 16"
                class="bi bi-x"
                fill="red"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
                ></path>
              </svg>
            </button>
          </td>
        </tr>
      );
    });
    return ings;
  };

  render() {
    return (
      <Fragment key={this.props.name}>
        <div className="card" id={this.props.id}>
          <div className="card-body">
            <div className="row">
              <div className="col-xl-3">
                <h5 className="card-title">{this.props.name}</h5>
                <a href="#" className="thumbnail">
                  <img
                    src={this.props.avatar}
                    alt="avatar"
                    className="rounded img-fluid"
                    width="100%"
                  />
                </a>
              </div>
              <div className="mt-4 col-xl-3">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th scope="row">carbs (g)</th>
                      <td>{Number(this.state.nutrition.carbs).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th scope="row">energy (kcal)</th>
                      <td>{Number(this.state.nutrition.energy).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th scope="row">fat (g)</th>
                      <td>{Number(this.state.nutrition.fat).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th scope="row">protein (g)</th>
                      <td>{Number(this.state.nutrition.protein).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th scope="row">amount (g)</th>
                      <td>{this.state.amount}</td>
                    </tr>
                    <tr>
                      <th scope="row">cost (£)</th>
                      <td>{this.calculateComponentCost(this.state.ingredients)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 col-xl-6">
                {/* <RIETextArea
                  value={this.state.description}
                  change={this.changeState}
                  propName="description"
                  //   className={this.state.highlight ? 'editable' : ''}
                  className="form-control rounded-0"
                  //   className="card-text"
                  // validate={this.isStringAcceptable}
                  classLoading="loading"
                  classInvalid="invalid"
                  //   isDisabled={this.state.isDisabled}
                /> */}
              </div>
            </div>

            <div className="mt-4 row">
              <div className="col-xl-12">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th scope="col">name</th>
                      <th scope="col">carbs (g)</th>
                      <th scope="col">energy (kcal)</th>
                      <th scope="col">fat (g)</th>
                      <th scope="col">protein (g)</th>
                      <th scope="col">amount (g)</th>
                      <th scope="col">price (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.renderIngredients()}
                    <tr className="table-warning">
                      <td>
                        <RIESelect
                          value={this.state.addIngredient}
                          // className={this.state.highlight ? "editable" : ""}
                          className="form-control"
                          options={this.getOptions()}
                          change={this.setStateOnIngredientAdd}
                          classLoading="loading"
                          propName="addIngredient"
                          //   isDisabled={this.state.isDisabled}
                        />
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>
                        <RIEInput
                          value={this.state.addIngredient.amount}
                          change={this.setStateOnAmountChange}
                          propName="addIngredient.amount"
                          //   className={this.state.highlight ? 'editable' : ''}
                          className="form-control"
                          classLoading="loading"
                          classInvalid="invalid"
                          //   isDisabled={this.state.isDisabled}
                        />
                      </td>
                      <td></td>
                      <td>
                        {/* <button type="button" class="btn">
                          <svg
                            width="2em"
                            height="2em"
                            viewBox="0 0 16 16"
                            class="bi bi-plus"
                            fill="green"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
                            ></path>
                          </svg>
                        </button> */}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>
                        <button
                          type="button"
                          class="btn btn-outline-success"
                          onClick={this.saveComponent.bind(this)}
                        >
                          Save
                        </button>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default RecipeComponent;
