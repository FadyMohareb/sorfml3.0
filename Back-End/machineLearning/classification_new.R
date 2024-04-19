########### CLASSIFICATION SCRIPT FOR SORFML ###########
rm(list = ls())

# take in command line arguments
commandArgs = commandArgs(trailingOnly=TRUE)

# test arguments
# commandArgs = c('sensoryScore',
# 'HPLC,Enose',
# '',
# 'SLC',
# 'raw',
# 'FALSE',
# '0.7',
# '4',
# '5',
# 'cv',
# '1,4,7,10,13,16,19,30,50,70,90,110',
# '0,0.03,0.06,0.09,0.2,0.3,0.6,0.9',
# '0,0.02,0.04,0.06,0.1,0.2,0.3,0.6',
# 'C:/Users/a_c_w/Documents/THESIS/sorfML_code/sorfml-master/Back-End/machineLearning/analysis/1657012335/R/',
# 'C:\\Users\\a_c_w\\Documents\\THESIS\\sorfML_code\\sorfml-master\\Back-End\\machineLearning\\analysis\\1657012335/HPLC_data.csv,C:\\Users\\a_c_w\\Documents\\THESIS\\sorfML_code\\sorfml-master\\Back-End\\machineLearning\\analysis\\1657012335/Enose_data.csv',
# 'C:\\Users\\a_c_w\\Documents\\THESIS\\sorfML_code\\sorfml-master\\Back-End\\machineLearning\\analysis\\1657012335/Sensory_score.csv',
# 'true',
# '',
# 'true')

# Create a list of arguments with proper name
args = vector(mode="list", length=19);
names(args) = c("typeMeta","platformsList", "bacteriaList", "mlmList", "pretreatment", "log", "percentage", "iteration", "tuneLength", "Resampling", "cost", "epsilon", "gamma", "RFolder", "savedFileNames", "typeMetaFile", "newModel", "modelPath", "is_metaFile");

# fill list with command line arguments
for (i in 1:length(args)){
  # String to a list because each argument is a string
  args[[i]] = strsplit(commandArgs[i], ",")[[1]]
}
# set working directory
setwd(args$RFolder)
plotDir =  args$RFolder

# load libraries
library(caret)
library(gplots)
library(ggfortify)
library(ggplot2)
library(likert)
library(gridExtra)
library(grid)

# read in classes csv file
classes <- read.csv(args$typeMetaFile, header = T)
colnames(classes)<-c("Sample", "classes")

# make empty df for results
results_df<-matrix(ncol=length(args$platformsList),nrow=length(args$mlmList))
colnames(results_df)<-args$platformsList
rownames(results_df)<-args$mlmList

# make empty df for resultsML script (ranked)
resML_df <- data.frame(matrix(ncol = 3, nrow = 0))
colnames(resML_df) <- c('Platform', 'ML method', 'Mean Accuracy/RMSE')

# vect of average accuracy per platform/algorithm combo
avg.accuracy.all <- c()

# perform for each analytical platform
for(i in 1:length(args$platformsList)){
# i = 1
  
  # read in data
  readings <- read.csv(args$savedFileNames[i], header = T)
  colnames(readings)[1]<-"Sample"
  
  
  cat("########################\n#### PRETREATMENTS ####\n########################\n\n")
  
  # remove sample names column
  pretreatdata<-readings[, -1]
  
  # log transform
  if (args$log){
    log(pretreatdata)}
  
  # centering or mean centering
  if (args$pretreatment=="center"){
    pretreatedData<-    apply(pretreatdata, 2, function(y) (y - mean(y)))}
  
  # normalization
  if (args$pretreatment=="norm"){
    pretreatedData<-apply(pretreatdata, 2, function(y) ((y - min(y))/ (max(y)-min(y))))}
  
  # range scaling
  if (args$pretreatment=="rscale"){
    pretreatedData<-apply(pretreatdata, 2, function(y) ((y - mean(y))/ (max(y)-min(y))))}
  
  # autoscaling
  if (args$pretreatment=="auto"){
    pretreatedData<-apply(pretreatdata, 2, function(y) ((y - mean(y))/ (sd(y))))}
  
  # pareto scaling
  if (args$pretreatment=="pareto"){
    pretreatedData<-apply(pretreatdata, 2, function(y) ( (y -mean(y)) / ( sqrt(sd(y)) ) ) )}
  
  # vast scaling
  if (args$pretreatment=="vast"){
    pretreatedData<-apply(pretreatdata, 2, function(y) ( ( (y- mean(y))*mean(y)) / ((sd(y))^2) ) )}
  
  # level scaling
  if (args$pretreatment=="level"){
    pretreatedData<-apply(pretreatdata, 2, function(y) ( (y -mean(y)) / (mean(y)) ) )}
  
  # Bind pretreated data to samples
  pretreatdata<-as.data.frame(pretreatdata)
  dataset<-cbind("Sample"=readings[,1], pretreatdata)
  
  
  cat("########################\n#### ARRANGE DATASETS ####\n########################\n\n")
  
  # Drop any duplicate rows from each dataset
  dataset <-  dataset[!duplicated(dataset),]
  classes <-  classes[!duplicated(classes),]
  
  # remove NA values from classes dataset
  classes <- na.omit(classes)
  
  # Perform inner merge by Sample column
  merged_data <- merge(dataset, classes, by = 'Sample')
  
  # Make Sample column row names
  datasetfull <- merged_data[,-1]
  rownames(datasetfull) <- merged_data[,1]
  
  # remove any rows with NA values in analytical reading columns (may change this to calculate mean)
  datasetfull <- na.omit(datasetfull)
  
  # make classes column factors
  datasetfull$classes=as.factor(datasetfull$classes)
  
  cat("########################\n#### PERFORM PCA ####\n########################\n\n")
  
  # create folder for results
  dir.create(paste0(plotDir, 'PCA/'), showWarnings = F)
  
  # perfom pca (check if needs to be scaled even if no pretreatment)
  pca <- prcomp(datasetfull[1:length(datasetfull)-1], center=FALSE, scale=FALSE)

  # plot 
  autoplot(pca, data =  datasetfull, colour = 'classes', main = paste0('PCA plot for ', args$platformsList[i]))
  
  # save PCA plots
  ggsave(paste0(plotDir, "PCA/","PCA_for_", args$platformsList[i],"_data.png"))

  
  cat("########################\n#### MACHINE LEARNING ####\n########################\n\n")
  
  # rank of accuracies for row in df
  rankres_tempdf <- data.frame(matrix(ncol = 2, nrow = 0))
  colnames(rankres_tempdf) <- c('MLalgorithm', 'avg_accuracy')
  
  
  for (ML in args$mlmList){
    
    # decide the algorithm 
    if (ML == 'RFC'){MLmethod <- 'rf'} # change to ordinalRF if authenicity
    if (ML == 'KNN'){MLmethod <- 'knn'}
    if (ML == 'SVC'){MLmethod <- 'svmRadial'}
    if (ML == 'PLSDA'){MLmethod <- 'pls'}
    if (ML == 'LDA'){MLmethod <-  'lda'}
    if (ML== 'SLC'){MLmethod <- 'stepLDA'}
    
    # list of the accuracy of each iteration
    iteration.accuracies <- c()
    
    
    for (z in 1:as.numeric(args$iteration)){
      
      # make training and test sets
      trainIndex <- createDataPartition(datasetfull$classes, p = as.numeric(args$percentage), 
                                        list = FALSE, 
                                        times = 1)
      trainSet <- datasetfull[trainIndex,]
      testSet <- datasetfull[-trainIndex,]
      trainclasses <- trainSet[,ncol(trainSet)]
      testclasses <- testSet[,ncol(testSet)]
      
      
      # train model
      trainctrl <- trainControl(method = args$Resampling, number = 5, repeats = 10)
      MLmodel <- train(classes~ ., data = trainSet, method = MLmethod, trControl = trainctrl, tuneLength = as.numeric(args$tuneLength))
      
      # predict test set classes
      predicted <- predict(MLmodel, testSet)
      
      # get accuracy of current iteration
      confusion.matrix <- confusionMatrix(predicted, testclasses)
      iteration.accuracy <- as.numeric(confusion.matrix$overall[1])
      iteration.accuracies <- c(iteration.accuracies, iteration.accuracy)
      
      # keep data of best iteration
      if (iteration.accuracy >= max(iteration.accuracies)){
        confusion.matrix2 <- confusion.matrix
        iteration.accuracy2 <- iteration.accuracy
        MLmodel2 <- MLmodel
      }
      
  
    }
    # get average accuracy from iterations
    avg.accuracy <- mean(iteration.accuracies)
    
    # populate vect of avg accuracies
    avg.accuracy.all <- c(avg.accuracy.all, avg.accuracy)
    
    # save best model and best model performance 
    if (avg.accuracy >= max(avg.accuracy.all)){
      best.confusion.matrix <- confusion.matrix2
      best.model <- MLmodel2
      best.model.accuracies <- iteration.accuracies # from all iterations (so more than one model)
      best.model.type <- c(args$platformsList[i], ML)
    }
    # Modified by Lea Saxton : check if the "class" folder exists, if not, create
    name_path <- "/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class/"
    if ( dir.exists( name_path ) == FALSE ) {
      cat( "\n\nNOTE : The dir 'class' does not exist so it was newly created.\n" )
      dir.create( name_path, showWarnings = FALSE )
    }
    model_filename <- paste0("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class/", args$platformsList[i], "_", ML, "_class.rds")
    saveRDS(best.model, model_filename)  
    accuracy_filename <- paste0("/Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/models/class/", args$platformsList[i], "_", ML, "_accuracy.txt")
    write.table(avg.accuracy, file = accuracy_filename, row.names = FALSE, col.names = FALSE)
    
    
    # populate results dataframe for heatmap
    results_df[ML, args$platformsList[i]] <- avg.accuracy
    
    # populate row in resultsML df
    resML_df[nrow(resML_df) + 1,] <- c(args$platformsList[i], ML, avg.accuracy)
  
  } 
}

# order resML df by accuracy
resML_df <- resML_df[order(resML_df$`Mean Accuracy/RMSE`, decreasing = T),]
resML_df$Rank <- 1:nrow(resML_df)


cat("########################\n#### MAKE HEATMAP ####\n########################\n\n")

# make directory
dir.create(paste0(plotDir, 'HEATMAPS/'), showWarnings = F)


if (length(args$platformsList)>1 && length(args$mlmList)>1){
  # start pdf to save plot
  pdf(paste0(plotDir, "HEATMAPS/", "Best_ML_method_by_RMSE.pdf"))
  
  # X11()
  heatmap.2(results_df, Rowv=FALSE, key=TRUE,
            cexCol = 1, cexRow=1,
            #cellnote = as.matrix(bestRmseTextDf),
            cellnote = results_df*100,
            notecol="black", notecex=0.7,
            margins =c(6,5),
            main = paste0("Best ML method by Accuracy"),
            scale = "none", density.info="none", trace="none",
            dendrogram="none", Colv="NA",)
            
  dev.off()
}

cat("########################\n#### CUMULATIVE MEAN PLOT ####\n########################\n\n")

# make directory
dir.create(paste0(plotDir, 'PERFORMANCE/'), showWarnings = F)

cuMean <- cumsum(best.model.accuracies) / seq_along(best.model.accuracies)
png(paste0(plotDir, "PCA/","Cumulative_Accuracy_Plot.png"))
plot(cuMean, type = 'l', lwd = 2, col = "red", 
     xlab = "Iteration", 
     ylab = "Cumulative Mean Accuracy", 
     main = paste0("Cumulative Mean Accuracy For Best model over ", args$iteration, " Iterations" ))

# save performance plots
# ggsave(filename = paste0(plotDir, "PCA/","cu_accuracy_plot.png"), plot = cuplot)
dev.off()



cat("########################\n#### VARIABLE IMPORTANCE ####\n########################\n\n")

var.importance <- varImp(best.model)$importance
var.importance$overall <- rowMeans(var.importance)
# varimp.df.knn.HPLC$overall <- rowMeans(varimp.df.knn.HPLC)
ggplot(var.importance, aes(reorder(rownames(var.importance), overall), overall)) + 
  geom_bar(stat = "identity")+
  coord_flip()+
  ggtitle("Variable Importance for Best model")+ 
  labs(y="Importance", x = "Variable")+
  geom_bar(stat="identity", fill = "orange") 

# save performance plots
ggsave(paste0(plotDir, "PCA/","Variable_Importance_Plot.png"))


cat("########################\n#### CONFUSION MATRIX ####\n########################\n\n")

# get data
cm <- best.confusion.matrix #create a confusion matrix
cm_d <- as.data.frame(cm$table) # extract the confusion matrix values as data.frame
cm_st <-data.frame(cm$overall) # confusion matrix statistics as data.frame
cm_st$cm.overall <- round(cm_st$cm.overall,2) # round the values
cm_d$diag <- cm_d$Prediction == cm_d$Reference # Get the Diagonal
cm_d$ndiag <- cm_d$Prediction != cm_d$Reference # Off Diagonal    
cm_d$Reference <-  reverse.levels(cm_d$Reference) # diagonal starts at top left
cm_d$ref_freq <- cm_d$Freq * ifelse(is.na(cm_d$diag),-1,1)

# make first plot
plt1 <-  ggplot(data = cm_d, aes(x = Prediction , y =  Reference, fill = Freq))+
  scale_x_discrete(position = "top") +
  geom_tile( data = cm_d,aes(fill = ref_freq)) +
  scale_fill_gradient2(guide = FALSE ,low="red3",high="orchid4", midpoint = 0,na.value = 'white') +
  geom_text(aes(label = Freq), color = 'black', size = 3)+
  theme_bw() +
  theme(panel.grid.major = element_blank(), panel.grid.minor = element_blank(),
        legend.position = "none",
        panel.border = element_blank(),
        plot.background = element_blank(),
        axis.line = element_blank(),
  )

# make second plot
plt2 <-  tableGrob(cm_st)

plt3 <- grid.arrange(plt1, plt2, nrow = 1, ncol = 2, 
             top=textGrob("Confusion Matrix for Best Model",gp=gpar(fontsize=25,font=1)))


# save performance plots
ggsave(filename = paste0(plotDir, "PCA/","Confusion_Matrix_for_Best_Model.png"), plot = plt3)


########### save results table ##########
write.csv(resML_df, file = paste0(plotDir, 'HEATMAPS/','resultsML.csv'), row.names = F)


cat("########################\n#### BEST MODEL INFO ####\n########################\n\n")

# get best model parameters
if (best.model.type[2] == 'RFC'){
  parameters <-  paste0('mtry=', best.model$bestTune[1,1], ', ntree=500')
}
if (best.model.type[2] == 'KNN'){
  parameters <-  paste0('k=', best.model$bestTune[1,1])
}
if (best.model.type[2] == 'SVC'){
  parameters <-  paste0('sigma=', best.model$bestTune[1,1], ', C=', best.model$bestTune[1,2])
}
if (best.model.type[2] == 'PLSDA'){
  parameters <-  paste0('ncomp=', best.model$bestTune[1,1])
}
if (best.model.type[2] == 'SLC'){
  parameters <-  paste0('maxvar=', best.model$bestTune[1,1], ', direction=', best.model$bestTune[1,2])
}
if (best.model.type[2] == 'LDA'){
  parameters <-  'NA'
}

# get training info
if (args$Resampling=='repeatedcv'){
  resamp <- 'repeated CV, repeats=10, folds=5'
}
if (args$Resampling=='cv'){
  resamp <- 'Cross validation, folds=5'
}
if (args$Resampling=='boot'){
  resamp <- 'Bootstrap, repeats=5'
}

# make data frame for best model from best platform/algorithm combo
bestModelInfo <- data.frame(matrix(ncol = 6, nrow = 0))
colnames(bestModelInfo) <-  c('Analytical Platform', 'ML Algortithm','Accuracy', 'Resampling Method', 'Tune Length', 'Parameters')

# populate row 
bestModelInfo[nrow(bestModelInfo) + 1,] <- c(best.model.type[1], 
                                             best.model.type[2], 
                                             best.confusion.matrix$overall[1], 
                                             resamp,
                                             args$tuneLength,
                                             parameters)
# make table figure
bestmodinfotable <- tableGrob(bestModelInfo, rows = NULL)

# save bestmodel info table
ggsave(filename = paste0(plotDir, "PCA/","Best_Model_Information.png"), plot = bestmodinfotable, width = 12, height = 1)


########## save results ML table ########
resultsML_table <- tableGrob(resML_df, rows = NULL)
image_height <- nrow(resML_df)*0.4 #automate image height
ggsave(filename = paste0(plotDir, "PCA/","All_Results.png"), plot = resultsML_table, width = 7, height = image_height)













