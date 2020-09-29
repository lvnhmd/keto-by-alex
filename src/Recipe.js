import React, { Component, Fragment } from 'react';
import { pickBy, includes, isEmpty } from 'lodash';
import { find, propEq, assoc, curry, when, map } from 'ramda';
import {
  RIEInput,
  RIEToggle,
  RIETextArea,
  RIENumber,
  RIETags,
  RIESelect,
} from 'riek';

// https://www.blog.duomly.com/bootstrap-tutorial/#1-creating-a-starter-template
const alter = curry((updateIngNutrition, ingId, items) =>
  map(when(propEq('_id', ingId), assoc('nutrition', updateIngNutrition)), items)
);

class Recipe extends React.Component {
  constructor(props) {
    super(props);
    // maintain an array for amount updates
    this.state = {
      description: props.description,
      //   isDisabled: false,
      rec_carbs: props.nutrition.carbs,
      rec_energy: props.nutrition.energy,
      rec_fat: props.nutrition.fat,
      rec_protein: props.nutrition.protein,
      rec_price: props.price,
      rec_amount: props.amount,
    };

    for (let i = 0; i < this.props.ingredients.length; i++) {
      const ing = this.props.ingredients[i];
      this.state[`ing_amount_${ing._id}`] = ing.amount;
      this.state[`ing_carbs_${ing._id}`] = ing.nutrition.carbs;
      this.state[`ing_energy_${ing._id}`] = ing.nutrition.energy;
      this.state[`ing_fat_${ing._id}`] = ing.nutrition.fat;
      this.state[`ing_protein_${ing._id}`] = ing.nutrition.protein;
      this.state[`ing_price_${ing._id}`] = ing.price;
    //   this.state[`ing_select_${ing._id}`] = {
    //     id: ing.ingredient._id,
    //     text: ing.ingredient.name,
    //   };
    }
  }

  calculateRecipeNutritionForIngredientAmount(ingId, updateIngNutrition) {
    // replace nutrition of ingredient which amount has changed
    const updateIngredients = alter(updateIngNutrition, ingId, [
      ...this.props.ingredients,
    ]);

    const ingNut = Object.values(
      updateIngredients.map((ing) => ({
        ...ing.nutrition,
      }))
    ).reduce((a, cv) => ({
      energy: a.energy + cv.energy,
      fat: a.fat + cv.fat,
      carbs: a.carbs + cv.carbs,
      protein: a.protein + cv.protein,
    }));

    let compNut = {
      energy: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    };

    if (this.props.components.length) {
      compNut = Object.values({
        ...this.props.components.map((ing) => ({
          ...ing.nutrition,
        })),
      }).reduce((a, cv) => ({
        energy: a.energy + cv.energy,
        fat: a.fat + cv.fat,
        carbs: a.carbs + cv.carbs,
        protein: a.protein + cv.protein,
      }));
    }

    return {
      energy: Number(ingNut.energy + compNut.energy).toFixed(2),
      fat: Number(ingNut.fat + compNut.fat).toFixed(2),
      carbs: Number(ingNut.carbs + compNut.carbs).toFixed(2),
      protein: Number(ingNut.protein + compNut.protein).toFixed(2),
    };
  }

  calculateOneIngredientNutritionForAmount(ingredient, amount) {
    const { energy, fat, carbs, protein, serving } = ingredient.ingredient;

    const nutritionForAmount = {
      energy: (energy / serving) * amount,
      fat: (fat / serving) * amount,
      carbs: (carbs / serving) * amount,
      protein: (protein / serving) * amount,
    };

    return nutritionForAmount;
  }

  calculatePriceForAmount(ingredient, amount) {
    const { price, packageSize } = ingredient.ingredient;
    return (price / packageSize) * amount;
  }

  changeState = (newState) => {
    console.log('-----------------New State----------------------');
    console.log(newState);
    const update = { ...newState };
    const shouldRecalculate = pickBy(update, (value, key) =>
      includes(key, 'ing_amount_')
    );
    if (!isEmpty(shouldRecalculate)) {
      // I know that the amount has changed, now I want to change the nutrition of this ingredient as well
      // I know that carbs_<ingid> is in state, need to set it's value - for now to 77, just to check
      const ingId = Object.keys(shouldRecalculate)[0].split('_')[2];
      const updateAmount = Object.values(shouldRecalculate)[0];

      const ingredient = find(propEq('_id', ingId))(this.props.ingredients);

      const updateIngNutrition = this.calculateOneIngredientNutritionForAmount(
        ingredient,
        updateAmount
      );

      update[`ing_carbs_${ingId}`] = updateIngNutrition.carbs;
      update[`ing_energy_${ingId}`] = updateIngNutrition.energy;
      update[`ing_fat_${ingId}`] = updateIngNutrition.fat;
      update[`ing_protein_${ingId}`] = updateIngNutrition.protein;
      //   update[`ing_price_${ingId}`] = this.calculatePriceForAmount(
      //     updateNutrition,
      //     updateAmount
      //   );
      // also the recipe's totals will change
      const updateRecipeNutrition = this.calculateRecipeNutritionForIngredientAmount(
        ingId,
        updateIngNutrition
      );
      update[`rec_carbs`] = updateRecipeNutrition.carbs;
      update[`rec_energy`] = updateRecipeNutrition.energy;
      update[`rec_fat`] = updateRecipeNutrition.fat;
      update[`rec_protein`] = updateRecipeNutrition.protein;
      update[`rec_price`] = 29;
      update[`rec_amount`] = 28;
    }
    this.setState(update);
  };

  renderIngredients = () => {
    let ings = [];
    ings = this.props.ingredients.map((ing) => {
      return (
        <tr key={ing._id} className="table-warning">
          <th scope="row">{ing.ingredient.name}
            {/* <RIESelect
              value={this.state[`ing_select_${ing._id}`]} //[`ing_select_${ing._id}`]
              //   className={this.state.highlight ? "editable" : ""}
              className="form-control"
              options={this.props.allIngredients[
                ing.ingredient.category
              ].map((i) => ({ id: i._id, text: i.name }))}
              change={this.changeState}
              classLoading="loading"
              propName={`ing_select_${ing._id}`}
              //   isDisabled={this.state.isDisabled}
            /> */}
          </th>
          <td>{Number(this.state[`ing_carbs_${ing._id}`]).toFixed(2)}</td>
          <td>{Number(this.state[`ing_energy_${ing._id}`]).toFixed(2)}</td>
          <td>{Number(this.state[`ing_fat_${ing._id}`]).toFixed(2)}</td>
          <td>{Number(this.state[`ing_protein_${ing._id}`]).toFixed(2)}</td>
          <td>
            <RIEInput
              value={this.state[`ing_amount_${ing._id}`]}
              change={this.changeState}
              propName={`ing_amount_${ing._id}`}
              //   className={this.state.highlight ? 'editable' : ''}
              className="form-control"
              classLoading="loading"
              classInvalid="invalid"
              //   isDisabled={this.state.isDisabled}
            />
          </td>
          <td>{this.state[`ing_price_${ing._id}`]}</td>
        </tr>
      );
    });
    return ings;
  };

  renderComponents = () => {
    let comps = [];
    comps = this.props.components.map((comp) => (
      <tr key={comp._id} className="table-success">
        <th scope="row"><a href={`#${comp._id}`} className="">{comp.name}</a></th>
        <td>{Number(comp.nutrition.carbs).toFixed(2)}</td>
        <td>{Number(comp.nutrition.energy).toFixed(2)}</td>
        <td>{Number(comp.nutrition.fat).toFixed(2)}</td>
        <td>{Number(comp.nutrition.protein).toFixed(2)}</td>
        <td></td>
        <td>{comp.price}</td>
      </tr>
    ));
    return comps;
  };
  render() {
    return (
      <Fragment key={this.props.name}>
        <div className="card">
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
                      <td>{this.state.rec_carbs}</td>
                    </tr>
                    <tr>
                      <th scope="row">energy (kcal)</th>
                      <td>{this.state.rec_energy}</td>
                    </tr>
                    <tr>
                      <th scope="row">fat (g)</th>
                      <td>{this.state.rec_fat}</td>
                    </tr>
                    <tr>
                      <th scope="row">protein (g)</th>
                      <td>{this.state.rec_protein}</td>
                    </tr>
                    <tr>
                      <th scope="row">amount (g)</th>
                      <td>{this.state.rec_amount}</td>
                    </tr>
                    <tr>
                      <th scope="row">price (£)</th>
                      <td>{this.state.rec_price}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 col-xl-6">
                <RIETextArea
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
                />
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
                    {this.renderComponents()}
                    {this.renderIngredients()}
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

export default Recipe;
