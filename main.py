import cv2
from matplotlib import pyplot as plt
import numpy as np
import imutils
import easyocr
import concurrent.futures
from collections import Counter
import time
from datetime import datetime

debug = 1

# Open the default camera (camera index 0)
cap = cv2.VideoCapture(0)

# Check if the camera is opened successfully
if not cap.isOpened():
    print("Error: Could not open camera.")
    exit()
reader = easyocr.Reader(['en'])
       
def start_timer(duration):
    candidates = []
    def ocr_thread(cropped_image):
        result = reader.readtext(cropped_image)
        if result and result[0] and len(result[0]) > 1:
            text = result[0][-2]
            font = cv2.FONT_HERSHEY_SIMPLEX
            res = cv2.putText(img, text=text, org=(approx[0][0][0], approx[1][0][1]+60), fontFace=font, fontScale=1, color=(0,255,0), thickness=2, lineType=cv2.LINE_AA)
            res = cv2.rectangle(img, tuple(approx[0][0]), tuple(approx[2][0]), (0,255,0),3)
            print(text)
            if (len(text)>2):
                candidates.append(text)
                counts = Counter(candidates)
                most_common_element, count = counts.most_common(1)[0]
                print("number plate condidate : ",most_common_element, " with ", (count/sum(counts.values()))*100 , "%")
                with open('CarsIn.txt', 'w') as file:
                    file.write(f"{most_common_element},{datetime.now()}")
            if debug == 1:
                plt.imshow(cv2.cvtColor(res, cv2.COLOR_BGR2RGB))
                plt.title('Captured Image')
                plt.axis('off')
                plt.show()
        else:
            if debug == 1:
                plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                plt.title('Captured Image')
                plt.axis('off')
                plt.show()
    start_time = time.time()
    while time.time() - start_time < duration:
        ret, img = cap.read()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) #grey pic
        bfilter = cv2.bilateralFilter(gray, 11, 17, 17) #Noise reduction
        edged = cv2.Canny(bfilter, 30, 200) #Edge detection
        keypoints = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contours = imutils.grab_contours(keypoints)
        threshold_area = 500
        contours = [contour for contour in contours if cv2.contourArea(contour) > threshold_area]   
        location = None
        for contour in contours:
            approx = cv2.approxPolyDP(contour, 10, True)
            if len(approx) == 4:
                location = approx
                break
        if location is not None and location.any():
            mask = np.zeros(gray.shape, np.uint8)
            new_image = cv2.drawContours(mask, [location], 0,255, -1)
            new_image = cv2.bitwise_and(img, img, mask=mask) #rectangle found
            (x,y) = np.where(mask==255)
            (x1, y1) = (np.min(x), np.min(y))
            (x2, y2) = (np.max(x), np.max(y))
            cropped_image = gray[x1:x2+1, y1:y2+1] #cropped img
            with concurrent.futures.ThreadPoolExecutor() as executor:
                executor.submit(ocr_thread, cropped_image)
        else :
            if debug == 1:
                plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                plt.title('Captured Image')
                plt.axis('off')
                plt.show()
                
a = start_timer(10)