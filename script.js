jQuery(function () {//potentially redundant wrapper, since I have the defer attribute
    var $snakeHead = $('#snakeHead');
    var $food = $('#food');
    var $pause = $('#pause');
    var $gameOver = $('#gameOver');
    var $board = $('#board');
    var $frame = $('#frame');
    var $score = $('#score');
    var $box = $('.box');

    var gridSize = 30//30x30 is best grid size for gameplay

    ///////////////////////////////////////////////////////
    //dynamically control all other elemenents
    var boardSide = 62.5
    ///////////////////////////////////////////////




    var boxSide = boardSide/gridSize;
    
    var initialTop = boardSide/3;
    var initialLeft = boardSide/3;
    var movementDistance = boxSide; 
    var directionInput = 'none';
    var movementInterval = 150;
    var isPaused = false;
    var isGameOver = false;
    var isResetTouch = false;
    var hasMovementCommandBeenIssued = false;
    var score = 0;


    // Set initial position
    var snakeBody;
    intializeGame();






    $gameOver.on('click', function(event){
        resetGame();
    })

    $gameOver.on('touchstart', function(event) {
        resetGame();
        isResetTouch = true;
    })



    $(document).on("keydown", function (e) {
        if(hasMovementCommandBeenIssued)
            return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                isPaused = false;
                if(directionInput == 'down')
                    break;
                directionInput = 'up'; 
                break;
            case 'ArrowDown':
            case 's':
                isPaused = false;
                if(directionInput == 'up')
                    break;
                directionInput = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
                isPaused = false;
                if(directionInput == 'right')
                    break;  
                directionInput = 'left';
                break;
            case 'ArrowRight':
            case 'd':
                isPaused = false; 
                if(directionInput == 'left')
                    break;  
                directionInput = 'right';
                break;
            case ' ':
                if(isGameOver){
                    resetGame();
                    break;
                }
                isPaused = !isPaused;
                break;
            default: return; 
        }

        hasMovementCommandBeenIssued = true;
        e.preventDefault(); 
    });

    var touchStartCoords = {'x':-1, 'y':-1}; // X and Y coordinates on touchstart
    var touchEndCoords = {'x':-1, 'y':-1}; // X and Y coordinates on touchend
   

    $(document).on('touchstart', function(event) {
        touchStartCoords.x = event.originalEvent.touches[0].pageX;
        touchStartCoords.y = event.originalEvent.touches[0].pageY;
    });

    $(document).on('touchend', function(event) {
        if(isResetTouch){
            resetTouchCoords();
            isResetTouch = false;
            return;
        }
        touchEndCoords.x = event.originalEvent.changedTouches[0].pageX;
        touchEndCoords.y = event.originalEvent.changedTouches[0].pageY;
        if(hasMovementCommandBeenIssued == false){
            determineSwipeDirection();
            hasMovementCommandBeenIssued = true
        }

        resetTouchCoords();
    });




    setInterval(function(){
        if($food.hasClass('visible') || isPaused || isGameOver)
            return;

        $food.removeClass('hidden');
        $food.addClass('visible');

        var randomTop = randomPosition(boardSide - boxSide);
        var randomLeft = randomPosition(boardSide - boxSide);

        $food.css({
            'top': randomTop + 'vmin',
            'left': randomLeft + 'vmin'
        });

        $food.data('top', randomTop);
        $food.data('left', randomLeft);

    }, 2000)









    //MAIN LOOP
    setInterval(function(){
        if(isGameOver)
            return;

        hasMovementCommandBeenIssued = false;

        // Toggle visibility based on isPaused and isGameOver states
        $pause.toggleClass('hidden', !isPaused).toggleClass('visible', isPaused);
        
        if(isPaused)
            return;
        
        var prevPosTop = $snakeHead.data('top');
        var prevPosLeft = $snakeHead.data('left');

        var newLocation = {
            top: $snakeHead.data('top'),
            left: $snakeHead.data('left')
        }
        newLocation.top = directionInput == 'up' ? $snakeHead.data('top') - movementDistance 
                        : directionInput == 'down' ? $snakeHead.data('top') + movementDistance
                        : newLocation.top;
                        
                        
        newLocation.left = directionInput == 'left' ? $snakeHead.data('left') - movementDistance 
                         : directionInput == 'right' ? $snakeHead.data('left') + movementDistance
                         : newLocation.left;


        if(isCrossingBottomBorder(newLocation)
        || isCrossingTopBorder(newLocation)
        || isCrossingLeftBorder(newLocation)
        || isCrossingRightBorder(newLocation)
        || isCrossingItself(newLocation)){
            isGameOver = true;
            $gameOver.toggleClass('visible', isGameOver);
            return;
        }



        switch (directionInput) {
            case 'up': 
                $snakeHead.data('top', Math.max(0, $snakeHead.data('top') - movementDistance)); 
                break;
            case 'down': 
                $snakeHead.data('top', Math.min(boardSide - boxSide, $snakeHead.data('top') + movementDistance)); 
                break;
            case 'left': 
                $snakeHead.data('left', Math.max(0, $snakeHead.data('left') - movementDistance)); 
                break;
            case 'right': 
                $snakeHead.data('left', Math.min(boardSide - boxSide, $snakeHead.data('left') + movementDistance));
                break;
            default: return; //if not currently moving, dont do anything past this
        }
    
        //movement functionality

        //food snake collision test and action
        if(Math.round($food.data('top')) == Math.round($snakeHead.data('top')) 
            && Math.round($food.data('left') )== Math.round($snakeHead.data('left'))){
            $food.addClass('hidden');
            $food.removeClass('visible');

            var bodyBox = snakeBody[snakeBody.length - 1].clone(true);
            bodyBox.removeAttr('id');

            $board.prepend(bodyBox);
            snakeBody.push(bodyBox);

            score += 100;
            $score.text(score);
        }


    
        $snakeHead.css({
            'top': $snakeHead.data('top') + 'vmin',
            'left': $snakeHead.data('left') + 'vmin'
        })
        
        var tempTop = 0;
        var tempLeft = 0;

        snakeBody.slice(1).forEach(element => {
        
            element.css({
                'top': prevPosTop + 'vmin',
                'left': prevPosLeft + 'vmin'
            })

            tempTop = prevPosTop;
            tempLeft = prevPosLeft;

            prevPosTop = element.data('top');
            prevPosLeft = element.data('left');

            element.data('top', tempTop);
            element.data('left', tempLeft);
           
        });

    }, movementInterval)//not fps, its movement per millisecond interval











    function resetGame() {
        killSnake();
        intializeGame();
        $gameOver.toggleClass('visible', isGameOver);
        $score.text(score);
    }

    function intializeGame() {
        directionInput = 'none';
        isPaused = false;
        isGameOver = false;
        hasMovementCommandBeenIssued = false;
        score = 0;
        resetTouchCoords();

        snakeBody = [$snakeHead];

        intializeBoardAndBoxSize();
        intializeStartPosition();
    }

    function intializeBoardAndBoxSize(){
        //75% + two 12.5% borders gives you 100%
        $box.css({
            'height': boxSide * .75 + 'vmin',
            'width': boxSide * .75 + 'vmin',
            'border-width': boxSide * .125 + 'vmin'
        })

        $board.css({
            'height': boardSide + 'vmin',
            'width': boardSide + 'vmin',  
        })

        $frame.css({
            'height': boardSide + 'vmin',
            'width': boardSide + 'vmin',  

        })

        $('.title').css({
            'width': boardSide * .925 + 'vmin'
        })

    }

    function intializeStartPosition(){
                
        $snakeHead.css({
            'top': initialTop + 'vmin',
            'left': initialLeft + 'vmin'
        });

        $snakeHead.data('top', initialTop);
        $snakeHead.data('left', initialLeft);

        $food.css({
            'top': (initialTop + (movementDistance * 2)) + 'vmin',
            'left': initialLeft + 'vmin'
        });

        $food.data('top', (initialTop + (movementDistance * 2)));
        $food.data('left', initialLeft);
        $food.removeClass('hidden');
        $food.addClass('visible');

    }

    function killSnake(){
        snakeBody.slice(1).forEach(element => {
            element.remove();
        });
        snakeBody = [];
    }

    function determineSwipeDirection() {
        //min swipe distance might be helpful
        var deltaX = touchEndCoords.x - touchStartCoords.x;
        var deltaY = touchEndCoords.y - touchStartCoords.y;
        var absDeltaX = Math.abs(deltaX);
        var absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
            // Horizontal swipe
                if(deltaX > 0){
                    if(directionInput == 'left')
                        return;
                    directionInput = 'right';
                }else{
                    if(directionInput == 'right')
                        return;
                    directionInput = 'left';
                }

        } else {
            // Vertical swipe
            if(deltaY > 0){
                if(directionInput == 'up')
                    return;
                directionInput = 'down';
            }else{
                if(directionInput == 'down')
                    return;
                directionInput = 'up';
            }
            
        }
    }

    function resetTouchCoords(){
        touchStartCoords = {'x':-1, 'y':-1}; 
        touchEndCoords = {'x':-1, 'y':-1}; 
    }



    function isCrossingTopBorder(newLocation){
        return 0 >  Math.round(newLocation.top);
    }

    function isCrossingBottomBorder(newLocation){
        return Math.round(boardSide - boxSide) < Math.round(newLocation.top);
    }

    function isCrossingLeftBorder(newLocation){
        return 0 >  Math.round(newLocation.left);
    }
    
    function isCrossingRightBorder(newLocation){
        return Math.round(boardSide - boxSide) < Math.round(newLocation.left);
    }

    function isCrossingItself(newLocation){
        return snakeBody.slice(1).some(element => {
            return element.data('top') == newLocation.top && element.data('left') == newLocation.left;
        });
    }


    // Function to generate a random position, rounded to the nearest factor of movemennt distance
    function randomPosition(maxValue) {
        return Math.floor(Math.random() * (maxValue / movementDistance)) * movementDistance;
    }



});
 
