import React, { Component, Fragment } from 'react';
import { find, propEq, findIndex, remove, update } from 'ramda';
import ComponentIngredient from './ComponentIngredient.js';

const shortid = require('shortid');
const fetch = require('node-fetch');

const domain = 'http://0be30ff24ef0.ngrok.io';

class RecipeComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      componentId: props.id,
      energy: Number(props.nutrition.energy).toFixed(2),
      fat: Number(props.nutrition.fat).toFixed(2),
      carbs: Number(props.nutrition.carbs).toFixed(2),
      protein: Number(props.nutrition.protein).toFixed(2),
      ingredients: props.ingredients.map((ing) => ({
        compIngId: ing._id,
        amount: ing.amount,
        energy: ing.ingredient.energy,
        fat: ing.ingredient.fat,
        carbs: ing.ingredient.carbs,
        protein: ing.ingredient.protein,
        _id: ing.ingredient._id,
        name: ing.ingredient.name,
        price: ing.ingredient.price,
        packageSize: ing.ingredient.packageSize,
        serving: ing.ingredient.serving,
        category: ing.ingredient.category,
      })),
    };
  }

  // calculateIngredientMacro = (ing, macro) =>
  //   (ing[macro] / ing.serving) * ing.amount;

  // calculateMacro(ings, macro) {
  //   const total = ings
  //     .map((ing) => //this.calculateIngredientMacro(ing, macro))
  //     ing[macro])
  //     .reduce((a, cv) => a+cv, 0);

  //   console.log('Total ', total);

  //   return total;
  // }

  // Number(
  //     (this.state[macro] / this.state.serving) * this.state.amount
  //   ).toFixed(2);

  // calculateComponentNutrition(ingredients) {
  //   const nutrition = ingredients.reduce((a, cv) => ({
  //     energy: a.energy + cv.energy,
  //     fat: a.fat + cv.fat,
  //     carbs: a.carbs + cv.carbs,
  //     protein: a.protein + cv.protein,
  //   }));

  //   return nutrition;
  // }

  calculateIngredientPrice(ingredient) {
    const { price, packageSize, amount } = ingredient;
    const pfa = (price / packageSize) * amount;
    return pfa ? Number(pfa).toFixed(2) : 0;
  }

  calculateComponentCost() {
    const cost = this.state.ingredients
      .map((ing) => this.calculateIngredientPrice(ing))
      .reduce((a, cv) => Number(a) + Number(cv));
    return Number(cost).toFixed(2);
  }

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

  eventhandler = (data) => {

    console.log(data);

    // const updateState = { ...this.state };
    // const compIngId = data.compIngId;
    // // update state ingredients with the one I have changed and recalculate nutrition and price
    // let updateIngredient = find(propEq('compIngId', compIngId))(
    //   updateState.ingredients
    // );

    // updateIngredient.amount = Number(data.amount);

    // const { id } = data.select;

    // //do not compare and patch the ingredient, either the amount has changed or the whole ingredient or both

    // if (id !== updateIngredient._id) {
    //   const replaceWith = find(propEq('_id', id))(
    //     Object.values(this.props.allIngredients).flat()
    //   );
    //   replaceWith.compIngId = compIngId;

    //   updateState.ingredients = update(
    //     findIndex(propEq('compIngId', compIngId))(updateState.ingredients),
    //     replaceWith,
    //     updateState.ingredients
    //   );
    // }

    // can not do this because amount is not set yet - no, actually it is in the ing 

    // updateState.energy = this.calculateMacro(updateState.ingredients, 'energy');
    // updateState.fat = this.calculateMacro(updateState.ingredients, 'fat');
    // updateState.carbs = this.calculateMacro(updateState.ingredients, 'carbs');
    // updateState.protein = this.calculateMacro(updateState.ingredients, 'protein');

    // this.calculateMacro(updateState.ingredients, 'energy');

    // this.setState(updateState);
  };

  renderIngredients = () => {
      const ings = this.state.ingredients.map((ing) => {
      return (
        <ComponentIngredient
          compIngId={ing.compIngId}
          _id={ing._id}
          name={ing.name}
          amount={ing.amount}
          energy={ing.energy}
          fat={ing.fat}
          carbs={ing.carbs}
          protein={ing.protein}
          price={ing.price}
          packageSize={ing.packageSize}
          serving={ing.serving}
          category={ing.category}
          allIngredients={this.props.allIngredients}
          onChange={this.eventhandler}
        />
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
                      <td>{this.state.carbs}</td>
                    </tr>
                    <tr>
                      <th scope="row">energy (kcal)</th>
                      <td>{this.state.energy}</td>
                    </tr>
                    <tr>
                      <th scope="row">fat (g)</th>
                      <td>{this.state.fat}</td>
                    </tr>
                    <tr>
                      <th scope="row">protein (g)</th>
                      <td>{this.state.protein}</td>
                    </tr>
                    <tr>
                      <th scope="row">weight (g)</th>
                      <td>{ this.props.weight && `${this.props.weight.raw} / ${this.props.weight.cooked}` }</td>
                    </tr>
                    <tr>
                      <th scope="row">cost (£)</th>
                      <td>{this.calculateComponentCost()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 col-xl-6"></div>
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
