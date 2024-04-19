#install.packages(c("caret", "e1071", "neuralnet", "pls", "randomForest", "rpart", "xgboost"))
library(caret)
# Load the jsonlite package
library(jsonlite)
library(randomForest)
library(e1071)
library(pls)
library(rpart)
library(xgboost)
library(neuralnet)

args <- commandArgs(trailingOnly = TRUE)

platform <- args[1]
bacteria <- args[2]
model <- args[3]
file_path <- args[4]
type <- args[5]

# Load model from .rda file if the user do not pick 
if (model == "best" & type=="regression") {
  model_files <- list.files(paste0("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/reg"), pattern=paste0(platform,"_",bacteria,"_.*\\.rda$"))
  models <- lapply(file.path("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/reg", model_files), load)
  rmse_file_path <- list.files(paste0("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/reg"), pattern=paste0(platform,"_",bacteria,"_.*\\.txt$"))
  rmse_value <- data.frame(RMSE = numeric(0))
  for (i in 1:length(rmse_file_path)) {
    path <- file.path("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/reg", rmse_file_path[i])
    if (!file.exists(path)) {
      stop(paste("File", path, "does not exist."))
    }
    rmse <- read.delim(path, header = FALSE, sep = "\t", dec = ".")
    rmse_value <- rbind(rmse_value, data.frame(RMSE = as.numeric(rmse[1,1])))
  }
  for (j in 1:length(model_files)){
    rownames(rmse_value)[j] <- model_files[j]
  }
  best_model_index <- which.min(rmse_value$RMSE)
  best_model <- rownames(rmse_value)[best_model_index]
  # Load model from .rda file
  model_file <- best_model
  model_dir <- "/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/reg"
  model_path <- file.path(model_dir, model_file)
  load(model_path)
} else if (model =="best" & type == "classification") {
  model_files <- list.files(paste0("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class"), pattern=paste0(platform,"_.*\\.rda$"))
  models <- lapply(file.path("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class", model_files), load)
  acc_file_path <- list.files(paste0("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class"), pattern=paste0(platform,"_.*\\_accuracy.txt$"))
  acc_value <- data.frame(Accuracy = numeric(0))
  for (i in 1:length(acc_file_path)) {
    path <- file.path("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class", acc_file_path[i])
    if (!file.exists(path)) {
      stop(paste("File", path, "does not exist."))
    }
    acc <- read.delim(path, header = FALSE, sep = "\t", dec = ".")
    acc_value <- rbind(acc_value, data.frame(Accuracy = as.numeric(acc[1,1])))
  }
  for (j in 1:length(model_files)){
    rownames(acc_value)[j] <- model_files[j]
  }
  best_model_index <- which.min(acc_value$Accuracy)
  best_model <- rownames(acc_value)[best_model_index]
  # Load model from .rda file
  model_file <- best_model
  model_dir <- "/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class"
  model_path <- file.path(model_dir, model_file)
  load(model_path)}else if (type=="classification") {
  model_file <- paste0(platform,"_", model, ".rda")
  model_path <- file.path("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class", model_file)
  load(model_path)} else {
  model_file <- paste0(platform, "_",bacteria,"_",model, ".rda")
  model_path <- file.path("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/reg", model_file)
  load(model_path)
}

# Load the JSON data into R as a list
json_data <- fromJSON(file_path)

# Convert the list to a data frame
new_data <- as.data.frame(json_data)

rownames(new_data) <- new_data[,1]

new_data <- new_data[,-1]

# Extract the sample IDs from the input data
sample_ids <- rownames(new_data)

if(model=="XGBoost"){
  new_data_dmatrix <- xgb.DMatrix(as.matrix(new_data))
  # Perform the prediction using the XGBoost model
  predictedValues <- predict(model_xgboost, new_data_dmatrix)
  # Convert predicted values back to factor with the levels from the training dataset
  predictions <- factor(predictedValues, levels = levels(training$y))
}else{
# Perform the prediction using the renamed new data
predictions <- predict(bestModel, new_data)
}
#predicted <- predictions[[1]]

# Convert predictions to a data frame
prediction_df <- data.frame(prediction = predictions)
rownames(prediction_df) <- sample_ids


# If there is more than one column in the prediction_df and type is regression, compute the average for each row
if (ncol(prediction_df) > 1 & type == "regression") {
  new_predicted <- rowMeans(prediction_df)
}

# Function to compute most frequent value in a row
most_common <- function(x) {
  freq <- table(x)
  names(freq)[which.max(freq)]
}

# If there is more than one column in the prediction_df and type is classification, compute the mode for each row
if (ncol(prediction_df) > 1 & type == "classification") {
  pred_matrix <- sapply(prediction_df, as.numeric) # Convert the predictions to a matrix
  new_predicted <- apply(pred_matrix,1, most_common)
}

# If there is only one column in the prediction_df
if (ncol(prediction_df) == 1) {
  new_predicted <- prediction_df[,1]
}

# Combine the sample IDs and predicted labels into a new data frame
output <- data.frame(id = rownames(new_data), label = new_predicted, model_file = model_file)

# Output predictions as JSON
jsonlite::toJSON(output)

