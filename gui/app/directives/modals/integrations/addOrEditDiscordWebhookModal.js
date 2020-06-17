"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("addOrEditDiscordWebhookModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Discord Channel</h4>
            </div>
            <div class="modal-body">
            
                <div>
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Name
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.nameError}">
                            <input type="text" id="nameField" class="form-control" ng-model="$ctrl.channel.name" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter name">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.nameError">Please provide a name.</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Webhook URL
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.urlError}">
                            <input type="text" id="urlField" class="form-control" ng-model="$ctrl.channel.webhookUrl" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="urlHelpBlock" placeholder="Enter url">
                            <span id="urlHelpBlock" class="help-block" ng-show="$ctrl.urlError">Please provide a valid Discord Webhook URL</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Add</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($timeout) {
                let $ctrl = this;

                $timeout(() => {
                    angular.element("#nameField").trigger("focus");
                }, 50);


                $ctrl.channel = {
                    name: "",
                    webhookUrl: ""
                };

                $ctrl.nameError = false;
                $ctrl.urlError = false;

                function validateName() {
                    let name = $ctrl.channel.name;
                    return name != null && name.length > 0;
                }

                function validateWebhookUrl() {
                    const webhookRegex = /^https:\/\/discordapp\.com\/api\/webhooks\/[^/\s]+\/[^/\s]+$/i;
                    const webhookUrl = $ctrl.channel.webhookUrl;
                    return webhookUrl != null && webhookUrl.length > 0 && webhookRegex.test(webhookUrl);
                }

                $ctrl.save = function() {
                    $ctrl.nameError = false;
                    $ctrl.urlError = false;

                    if (!validateName()) {
                        $ctrl.nameError = true;
                    }

                    if (!validateWebhookUrl()) {
                        $ctrl.urlError = true;
                    }

                    if ($ctrl.nameError || $ctrl.urlError) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            channel: $ctrl.channel
                        }
                    });
                };

                $ctrl.$onInit = function() {
                    if ($ctrl.resolve.channel != null) {
                        $ctrl.channel = JSON.parse(JSON.stringify($ctrl.resolve.channel));
                    }
                };
            }
        });
}());