The cumulative final exam: 25 questions from all units. Pass mark: **75 %**. Take your time.

:::quiz
? In machine learning (vs traditional programming), what do you provide to obtain a model?
+ examples (data) together with the correct answers
- the rules and the answers
- only the rules
> Training produces the model from examples + answers.

? `X.shape == (500, 8)`. How many observations?
= 500
> Rows are observations.

? A notebook prints a value that comes from a cell you deleted earlier. Why does it still work?
+ The variable still lives in the kernel's memory
- The file still contains the cell
- Python caches all files
> Only restarting the kernel clears it.

? Which tool packages an application with its runtime dependencies?
+ Docker
- venv
- Vagrant
> Containers package application environments.

? Which encoding should be used for a nominal feature like “colour”?
+ one-hot encoding
- integer codes 1, 2, 3
> Avoid inventing an order.

? Targets [2, 4, 6], predictions [3, 4, 4]. MSE?
= 1.6667
> (1 + 0 + 4) / 3.

? w = 1.5, derivative = −4, learning rate = 0.25. New w?
= 2.5
> 1.5 − 0.25 · (−4) = 2.5.

? The loss explodes during training. Most likely fix?
+ reduce the learning rate
- increase the learning rate
- train more epochs
> Divergence comes from too-large steps.

? 1200 rows, batch size 100, 3 epochs: number of updates?
= 36
> 12 per epoch × 3.

? `df[["a"]]` returns…
+ a DataFrame with one column
- a Series
> Double brackets → DataFrame.

? σ(0) equals…
= 0.5
> The decision boundary of logistic regression.

? True label 1, predicted p = 0.05. The log loss is…
+ large (≈ 3.0)
- small (≈ 0.05)
> −log(0.05) ≈ 3.0.

? Multiclass prediction with probabilities (0.45, 0.35, 0.20):
+ class 1 (the largest), even though it is below 0.5
- no class
> argmax.

? Smaller `C` in scikit-learn's LogisticRegression means…
+ stronger regularisation
- weaker regularisation
> C is inverse regularisation strength.

? P(spam) = 0.3, P(word | spam) = 0.6, P(word | ham) = 0.1. P(spam | word)?
= 0.72 tol=0.005
> 0.18 / (0.18 + 0.07) = 0.72.

? What is “naive” about Naive Bayes?
+ features are assumed conditionally independent given the class
- it ignores the class prior
> Each feature is modelled separately per class.

? TP = 45, FP = 5, FN = 15. Recall?
= 0.75
> 45 / 60.

? Where should model selection happen?
+ on validation data or cross-validation inside the training set
- on the final test set
> The test set is used once.

? K-means vs KNN: which uses labels during fit?
- K-means
+ KNN
> KNN is supervised.

? Inertia always decreases as K grows. True or false?
+ True
- False
> Hence it cannot alone choose K.

? In NMF, a message can have high weights for several topics.
+ True
- False
> Documents are mixtures of topics.

? A screening test for a dangerous, treatable disease should prioritise…
+ recall
- precision
> Avoid missed cases.

? Using “final grade” to predict “passes the final exam” is an example of…
+ data leakage
- underfitting
- regularisation
> The feature is not available at prediction time.

? SUS answers: odd items all 5, even items all 1. Score?
= 100
> Best possible answers.

? p_o = 0.9, p_e = 0.6. Cohen's kappa?
= 0.75
> (0.9 − 0.6) / 0.4.
:::
